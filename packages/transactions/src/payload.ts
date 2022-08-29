import { concatArray, IntegerType, intToBigInt, intToBytes, writeUInt32BE } from '@stacks/common';
import { ClarityVersion, COINBASE_BYTES_LENGTH, PayloadType, StacksMessageType } from './constants';

import { BytesReader } from './bytesReader';
import { ClarityValue, deserializeCV, serializeCV } from './clarity/';
import { PrincipalCV, principalCV } from './clarity/types/principalCV';
import { Address } from './common';
import { createAddress, createLPString, LengthPrefixedString } from './postcondition-types';
import {
  codeBodyString,
  createMemoString,
  deserializeAddress,
  deserializeLPString,
  deserializeMemoString,
  MemoString,
  serializeStacksMessage,
} from './types';

export type Payload =
  | TokenTransferPayload
  | ContractCallPayload
  | SmartContractPayload
  | VersionedSmartContractPayload
  | PoisonPayload
  | CoinbasePayload
  | CoinbasePayloadToAltRecipient;

export function isTokenTransferPayload(p: Payload): p is TokenTransferPayload {
  return p.payloadType === PayloadType.TokenTransfer;
}
export function isContractCallPayload(p: Payload): p is ContractCallPayload {
  return p.payloadType === PayloadType.ContractCall;
}
export function isSmartContractPayload(p: Payload): p is SmartContractPayload {
  return p.payloadType === PayloadType.SmartContract;
}
export function isPoisonPayload(p: Payload): p is PoisonPayload {
  return p.payloadType === PayloadType.PoisonMicroblock;
}
export function isCoinbasePayload(p: Payload): p is CoinbasePayload {
  return p.payloadType === PayloadType.Coinbase;
}

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
  | VersionedSmartContractPayload
  | PoisonPayload
  | CoinbasePayload
  | CoinbasePayloadToAltRecipient;

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

export interface VersionedSmartContractPayload {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.VersionedSmartContract;
  readonly clarityVersion: ClarityVersion;
  readonly contractName: LengthPrefixedString;
  readonly codeBody: LengthPrefixedString;
}

export function createSmartContractPayload(
  contractName: string | LengthPrefixedString,
  codeBody: string | LengthPrefixedString,
  clarityVersion?: ClarityVersion
): SmartContractPayload | VersionedSmartContractPayload {
  if (typeof contractName === 'string') {
    contractName = createLPString(contractName);
  }
  if (typeof codeBody === 'string') {
    codeBody = codeBodyString(codeBody);
  }

  if (typeof clarityVersion === 'number') {
    return {
      type: StacksMessageType.Payload,
      payloadType: PayloadType.VersionedSmartContract,
      clarityVersion,
      contractName,
      codeBody,
    };
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

export interface CoinbasePayloadToAltRecipient {
  readonly type: StacksMessageType.Payload;
  readonly payloadType: PayloadType.CoinbaseToAltRecipient;
  readonly coinbaseBytes: Uint8Array;
  readonly recipient: PrincipalCV;
}

export function createCoinbasePayload(
  coinbaseBytes: Uint8Array,
  altRecipient?: PrincipalCV
): CoinbasePayload | CoinbasePayloadToAltRecipient {
  if (coinbaseBytes.byteLength != COINBASE_BYTES_LENGTH) {
    throw Error(`Coinbase buffer size must be ${COINBASE_BYTES_LENGTH} bytes`);
  }

  if (altRecipient != undefined) {
    return {
      type: StacksMessageType.Payload,
      payloadType: PayloadType.CoinbaseToAltRecipient,
      coinbaseBytes,
      recipient: altRecipient,
    };
  }
  return {
    type: StacksMessageType.Payload,
    payloadType: PayloadType.Coinbase,
    coinbaseBytes,
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
    case PayloadType.VersionedSmartContract:
      bytesArray.push(payload.clarityVersion);
      bytesArray.push(serializeStacksMessage(payload.contractName));
      bytesArray.push(serializeStacksMessage(payload.codeBody));
      break;
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      break;
    case PayloadType.Coinbase:
      bytesArray.push(payload.coinbaseBytes);
      break;
    case PayloadType.CoinbaseToAltRecipient:
      bytesArray.push(payload.coinbaseBytes);
      bytesArray.push(serializeCV(payload.recipient));
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

    case PayloadType.VersionedSmartContract: {
      const clarityVersion = bytesReader.readUInt8Enum(ClarityVersion, n => {
        throw new Error(`Cannot recognize ClarityVersion: ${n}`);
      });
      const smartContractName = deserializeLPString(bytesReader);
      const codeBody = deserializeLPString(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody, clarityVersion);
    }
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      return createPoisonPayload();
    case PayloadType.Coinbase:
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      return createCoinbasePayload(coinbaseBytes);
    case PayloadType.CoinbaseToAltRecipient:
      const coinbaseToAltRecipientBuffer = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      const altRecipient = deserializeCV(bytesReader) as PrincipalCV;
      return createCoinbasePayload(coinbaseToAltRecipientBuffer, altRecipient);
  }
}
