import { concatArray, IntegerType, intToBigInt, intToBytes, writeUInt32BE } from '@stacks/common';
import { COINBASE_BYTES_LENGTH, PayloadType, StacksMessageType } from './constants';

import {
  MemoString,
  createMemoString,
  serializeStacksMessage,
  deserializeAddress,
  deserializeLPString,
  deserializeMemoString,
  codeBodyString,
} from './types';
import { createAddress, LengthPrefixedString, createLPString } from './postcondition-types';
import { Address } from './common';
import { ClarityValue, serializeCV, deserializeCV } from './clarity/';

import { BytesReader } from './bytesReader';
import { PrincipalCV, principalCV } from './clarity/types/principalCV';

export type Payload =
  | TokenTransferPayload
  | ContractCallPayload
  | SmartContractPayload
  | PoisonPayload
  | CoinbasePayload;

export interface TokenTransferPayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.TokenTransfer;
  readonly recipient: PrincipalCV;
  readonly amount: bigint;
  readonly memo: MemoString;
}

export type PayloadInput =
  | (TokenTransferPayload | (Omit<TokenTransferPayload, 'amount'> & { amount: IntegerType }))
  | ContractCallPayload
  | SmartContractPayload
  | PoisonPayload
  | CoinbasePayload;

export function createTokenTransferPayload(
  recipient: string | PrincipalCV,
  amount: IntegerType,
  memo?: string | MemoString
): TokenTransferPayload {
  if (typeof recipient === 'string') {
    recipient = principalCV(recipient);
  }
  if (typeof memo === 'string') {
    memo = createMemoString(memo);
  }

  return {
    type: StacksMessageType.Payload,
    payloadType: PayloadType.TokenTransfer,
    recipient,
    amount: intToBigInt(amount, false),
    memo: memo ?? createMemoString(''),
  };
}

export interface ContractCallPayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.ContractCall;
  readonly contractAddress: Address;
  readonly contractName: LengthPrefixedString;
  readonly functionName: LengthPrefixedString;
  readonly functionArgs: ClarityValue[];
}

export function createContractCallPayload(
  contractAddress: string | Address,
  contractName: string | LengthPrefixedString,
  functionName: string | LengthPrefixedString,
  functionArgs: ClarityValue[]
): ContractCallPayload {
  if (typeof contractAddress === 'string') {
    contractAddress = createAddress(contractAddress);
  }
  if (typeof contractName === 'string') {
    contractName = createLPString(contractName);
  }
  if (typeof functionName === 'string') {
    functionName = createLPString(functionName);
  }

  return {
    type: StacksMessageType.Payload,
    payloadType: PayloadType.ContractCall,
    contractAddress,
    contractName,
    functionName,
    functionArgs,
  };
}

export interface SmartContractPayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.SmartContract;
  readonly contractName: LengthPrefixedString;
  readonly codeBody: LengthPrefixedString;
}

export function createSmartContractPayload(
  contractName: string | LengthPrefixedString,
  codeBody: string | LengthPrefixedString
): SmartContractPayload {
  if (typeof contractName === 'string') {
    contractName = createLPString(contractName);
  }
  if (typeof codeBody === 'string') {
    codeBody = codeBodyString(codeBody);
  }

  return {
    type: StacksMessageType.Payload,
    payloadType: PayloadType.SmartContract,
    contractName,
    codeBody,
  };
}

export interface PoisonPayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.PoisonMicroblock;
}

export function createPoisonPayload(): PoisonPayload {
  return { type: StacksMessageType.Payload, payloadType: PayloadType.PoisonMicroblock };
}

export interface CoinbasePayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.Coinbase;
  readonly coinbaseBytes: Uint8Array;
}

export function createCoinbasePayload(coinbaseBytes: Uint8Array): CoinbasePayload {
  if (coinbaseBytes.byteLength != COINBASE_BYTES_LENGTH) {
    throw Error(`Coinbase length must be ${COINBASE_BYTES_LENGTH} bytes`);
  }
  return {
    type: StacksMessageType.Payload,
    payloadType: PayloadType.Coinbase,
    coinbaseBytes: coinbaseBytes,
  };
}

export function serializePayload(payload: PayloadInput): Uint8Array {
  const bytesArray = [];
  bytesArray.push(payload.payloadType);

  switch (payload.payloadType) {
    case PayloadType.TokenTransfer:
      bytesArray.push(serializeCV(payload.recipient));
      bytesArray.push(intToBytes(payload.amount, false, 8));
      bytesArray.push(serializeStacksMessage(payload.memo));
      break;
    case PayloadType.ContractCall:
      bytesArray.push(serializeStacksMessage(payload.contractAddress));
      bytesArray.push(serializeStacksMessage(payload.contractName));
      bytesArray.push(serializeStacksMessage(payload.functionName));
      const numArgs = new Uint8Array(4);
      writeUInt32BE(numArgs, payload.functionArgs.length, 0);
      bytesArray.push(numArgs);
      payload.functionArgs.forEach(arg => {
        bytesArray.push(serializeCV(arg));
      });
      break;
    case PayloadType.SmartContract:
      bytesArray.push(serializeStacksMessage(payload.contractName));
      bytesArray.push(serializeStacksMessage(payload.codeBody));
      break;
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      break;
    case PayloadType.Coinbase:
      bytesArray.push(payload.coinbaseBytes);
      break;
  }

  return concatArray(bytesArray);
}

export function deserializePayload(bytesReader: BytesReader): Payload {
  const payloadType = bytesReader.readUInt8Enum(PayloadType, n => {
    throw new Error(`Cannot recognize PayloadType: ${n}`);
  });

  switch (payloadType) {
    case PayloadType.TokenTransfer:
      const recipient = deserializeCV(bytesReader) as PrincipalCV;
      const amount = intToBigInt(bytesReader.readBytes(8), false);
      const memo = deserializeMemoString(bytesReader);
      return createTokenTransferPayload(recipient, amount, memo);
    case PayloadType.ContractCall:
      const contractAddress = deserializeAddress(bytesReader);
      const contractCallName = deserializeLPString(bytesReader);
      const functionName = deserializeLPString(bytesReader);
      const functionArgs: ClarityValue[] = [];
      const numberOfArgs = bytesReader.readUInt32BE();
      for (let i = 0; i < numberOfArgs; i++) {
        const clarityValue = deserializeCV(bytesReader);
        functionArgs.push(clarityValue);
      }
      return createContractCallPayload(
        contractAddress,
        contractCallName,
        functionName,
        functionArgs
      );
    case PayloadType.SmartContract:
      const smartContractName = deserializeLPString(bytesReader);
      const codeBody = deserializeLPString(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody);
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      return createPoisonPayload();
    case PayloadType.Coinbase:
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      return createCoinbasePayload(coinbaseBytes);
  }
}
