import {
  bytesToHex,
  concatArray,
  hexToBytes,
  IntegerType,
  intToBigInt,
  intToBytes,
  isInstance,
  writeUInt32BE,
  writeUInt8,
} from '@stacks/common';
import { BytesReader } from './bytesReader';
import {
  ClarityType,
  ClarityValue,
  deserializeCV,
  noneCV,
  OptionalCV,
  principalCV,
  serializeCVBytes,
  someCV,
} from './clarity/';
import { AddressWire } from './common';
import {
  ClarityVersion,
  COINBASE_BYTES_LENGTH,
  PayloadType,
  StacksWireType,
  VRF_PROOF_BYTES_LENGTH,
} from './constants';
import { createAddress, createLPString, LengthPrefixedStringWire } from './postcondition-types';
import {
  codeBodyString,
  createMemoString,
  deserializeAddressBytes,
  deserializeLPStringBytes,
  deserializeMemoStringBytes,
  MemoStringWire,
  serializeStacksWireBytes,
} from './types';
import { PrincipalCV } from './clarity/types';

export type PayloadWire =
  | TokenTransferPayloadWire
  | ContractCallPayload
  | SmartContractPayloadWire
  | VersionedSmartContractPayloadWire
  | PoisonPayloadWire
  | CoinbasePayloadWire
  | CoinbasePayloadToAltRecipient
  | NakamotoCoinbasePayloadWire
  | TenureChangePayloadWire;

export function isTokenTransferPayload(p: PayloadWire): p is TokenTransferPayloadWire {
  return p.payloadType === PayloadType.TokenTransfer;
}
export function isContractCallPayload(p: PayloadWire): p is ContractCallPayload {
  return p.payloadType === PayloadType.ContractCall;
}
export function isSmartContractPayload(p: PayloadWire): p is SmartContractPayloadWire {
  return p.payloadType === PayloadType.SmartContract;
}
export function isPoisonPayload(p: PayloadWire): p is PoisonPayloadWire {
  return p.payloadType === PayloadType.PoisonMicroblock;
}
export function isCoinbasePayload(p: PayloadWire): p is CoinbasePayloadWire {
  return p.payloadType === PayloadType.Coinbase;
}

export interface TokenTransferPayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.TokenTransfer;
  readonly recipient: PrincipalCV;
  readonly amount: bigint;
  readonly memo: MemoStringWire;
}

export type PayloadInput =
  | (
      | TokenTransferPayloadWire
      | (Omit<TokenTransferPayloadWire, 'amount'> & { amount: IntegerType })
    )
  | ContractCallPayload
  | SmartContractPayloadWire
  | VersionedSmartContractPayloadWire
  | PoisonPayloadWire
  | CoinbasePayloadWire
  | CoinbasePayloadToAltRecipient
  | NakamotoCoinbasePayloadWire
  | TenureChangePayloadWire;

export function createTokenTransferPayload(
  recipient: string | PrincipalCV,
  amount: IntegerType,
  memo?: string | MemoStringWire
): TokenTransferPayloadWire {
  if (typeof recipient === 'string') {
    recipient = principalCV(recipient);
  }
  if (typeof memo === 'string') {
    memo = createMemoString(memo);
  }

  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.TokenTransfer,
    recipient,
    amount: intToBigInt(amount, false),
    memo: memo ?? createMemoString(''),
  };
}

export interface ContractCallPayload {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.ContractCall;
  readonly contractAddress: AddressWire;
  readonly contractName: LengthPrefixedStringWire;
  readonly functionName: LengthPrefixedStringWire;
  readonly functionArgs: ClarityValue[];
}

export function createContractCallPayload(
  contractAddress: string | AddressWire,
  contractName: string | LengthPrefixedStringWire,
  functionName: string | LengthPrefixedStringWire,
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
    type: StacksWireType.Payload,
    payloadType: PayloadType.ContractCall,
    contractAddress,
    contractName,
    functionName,
    functionArgs,
  };
}

export interface SmartContractPayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.SmartContract;
  readonly contractName: LengthPrefixedStringWire;
  readonly codeBody: LengthPrefixedStringWire;
}

export interface VersionedSmartContractPayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.VersionedSmartContract;
  readonly clarityVersion: ClarityVersion;
  readonly contractName: LengthPrefixedStringWire;
  readonly codeBody: LengthPrefixedStringWire;
}

export function createSmartContractPayload(
  contractName: string | LengthPrefixedStringWire,
  codeBody: string | LengthPrefixedStringWire,
  clarityVersion?: ClarityVersion
): SmartContractPayloadWire | VersionedSmartContractPayloadWire {
  if (typeof contractName === 'string') {
    contractName = createLPString(contractName);
  }
  if (typeof codeBody === 'string') {
    codeBody = codeBodyString(codeBody);
  }

  if (typeof clarityVersion === 'number') {
    return {
      type: StacksWireType.Payload,
      payloadType: PayloadType.VersionedSmartContract,
      clarityVersion,
      contractName,
      codeBody,
    };
  }
  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.SmartContract,
    contractName,
    codeBody,
  };
}

export interface PoisonPayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.PoisonMicroblock;
}

export function createPoisonPayload(): PoisonPayloadWire {
  return { type: StacksWireType.Payload, payloadType: PayloadType.PoisonMicroblock };
}

export interface CoinbasePayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.Coinbase;
  readonly coinbaseBytes: Uint8Array;
}

export interface CoinbasePayloadToAltRecipient {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.CoinbaseToAltRecipient;
  readonly coinbaseBytes: Uint8Array;
  readonly recipient: PrincipalCV;
}

export function createCoinbasePayload(
  coinbaseBytes: Uint8Array,
  altRecipient?: PrincipalCV
): CoinbasePayloadWire | CoinbasePayloadToAltRecipient {
  if (coinbaseBytes.byteLength != COINBASE_BYTES_LENGTH) {
    throw Error(`Coinbase buffer size must be ${COINBASE_BYTES_LENGTH} bytes`);
  }

  if (altRecipient != undefined) {
    return {
      type: StacksWireType.Payload,
      payloadType: PayloadType.CoinbaseToAltRecipient,
      coinbaseBytes,
      recipient: altRecipient,
    };
  }
  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.Coinbase,
    coinbaseBytes,
  };
}

export interface NakamotoCoinbasePayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.NakamotoCoinbase;
  readonly coinbaseBytes: Uint8Array;
  readonly recipient?: PrincipalCV;
  readonly vrfProof: Uint8Array;
}

export function createNakamotoCoinbasePayload(
  coinbaseBytes: Uint8Array,
  recipient: OptionalCV<PrincipalCV>,
  vrfProof: Uint8Array
): NakamotoCoinbasePayloadWire {
  if (coinbaseBytes.byteLength != COINBASE_BYTES_LENGTH) {
    throw Error(`Coinbase buffer size must be ${COINBASE_BYTES_LENGTH} bytes`);
  }

  if (vrfProof.byteLength != VRF_PROOF_BYTES_LENGTH) {
    throw Error(`VRF proof buffer size must be ${VRF_PROOF_BYTES_LENGTH} bytes`);
  }

  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.NakamotoCoinbase,
    coinbaseBytes,
    recipient: recipient.type === ClarityType.OptionalSome ? recipient.value : undefined,
    vrfProof,
  };
}

export enum TenureChangeCause {
  /** A valid winning block-commit */
  BlockFound = 0,
  /** The next burnchain block is taking too long, so extend the runtime budget */
  Extended = 1,
}

export interface TenureChangePayloadWire {
  readonly type: StacksWireType.Payload;
  readonly payloadType: PayloadType.TenureChange;
  /**
   * The consensus hash of this tenure (hex string). Corresponds to the
   * sortition in which the miner of this block was chosen. It may be the case
   * that this miner's tenure gets _extended_ acrosssubsequent sortitions; if
   * this happens, then this `consensus_hash` value _remains the same _as the
   * sortition in which the winning block-commit was mined.
   */
  readonly tenureHash: string;
  /**
   * The consensus hash (hex string) of the previous tenure.  Corresponds to the
   * sortition of the previous winning block-commit.
   */
  readonly previousTenureHash: string;
  /**
   * Current consensus hash (hex string) on the underlying burnchain.
   * Corresponds to the last-seen sortition.
   */
  readonly burnViewHash: string;
  /** Stacks block hash (hex string) */
  readonly previousTenureEnd: string;
  /** The number of blocks produced since the last sortition-linked tenure */
  readonly previousTenureBlocks: number;
  /** The cause of change in mining tenure */
  readonly cause: TenureChangeCause;
  /** The public key hash of the current tenure (hex string) */
  readonly publicKeyHash: string;
}

export function createTenureChangePayload(
  tenureHash: string,
  previousTenureHash: string,
  burnViewHash: string,
  previousTenureEnd: string,
  previousTenureBlocks: number,
  cause: TenureChangeCause,
  publicKeyHash: string
): TenureChangePayloadWire {
  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.TenureChange,
    tenureHash,
    previousTenureHash,
    burnViewHash,
    previousTenureEnd,
    previousTenureBlocks,
    cause,
    publicKeyHash,
  };
}

export function serializePayload(payload: PayloadInput): string {
  return bytesToHex(serializePayloadBytes(payload));
}
/** @ignore */
export function serializePayloadBytes(payload: PayloadInput): Uint8Array {
  const bytesArray = [];
  bytesArray.push(payload.payloadType);

  switch (payload.payloadType) {
    case PayloadType.TokenTransfer:
      bytesArray.push(serializeCVBytes(payload.recipient));
      bytesArray.push(intToBytes(payload.amount, false, 8));
      bytesArray.push(serializeStacksWireBytes(payload.memo));
      break;
    case PayloadType.ContractCall:
      bytesArray.push(serializeStacksWireBytes(payload.contractAddress));
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.functionName));
      const numArgs = new Uint8Array(4);
      writeUInt32BE(numArgs, payload.functionArgs.length, 0);
      bytesArray.push(numArgs);
      payload.functionArgs.forEach(arg => {
        bytesArray.push(serializeCVBytes(arg));
      });
      break;
    case PayloadType.SmartContract:
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.codeBody));
      break;
    case PayloadType.VersionedSmartContract:
      bytesArray.push(payload.clarityVersion);
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.codeBody));
      break;
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      break;
    case PayloadType.Coinbase:
      bytesArray.push(payload.coinbaseBytes);
      break;
    case PayloadType.CoinbaseToAltRecipient:
      bytesArray.push(payload.coinbaseBytes);
      bytesArray.push(serializeCVBytes(payload.recipient));
      break;
    case PayloadType.NakamotoCoinbase:
      bytesArray.push(payload.coinbaseBytes);
      bytesArray.push(serializeCVBytes(payload.recipient ? someCV(payload.recipient) : noneCV()));
      bytesArray.push(payload.vrfProof);
      break;
    case PayloadType.TenureChange:
      bytesArray.push(hexToBytes(payload.tenureHash));
      bytesArray.push(hexToBytes(payload.previousTenureHash));
      bytesArray.push(hexToBytes(payload.burnViewHash));
      bytesArray.push(hexToBytes(payload.previousTenureEnd));
      bytesArray.push(writeUInt32BE(new Uint8Array(4), payload.previousTenureBlocks));
      bytesArray.push(writeUInt8(new Uint8Array(1), payload.cause));
      bytesArray.push(hexToBytes(payload.publicKeyHash));
      break;
  }

  return concatArray(bytesArray);
}

export function deserializePayload(serialized: string): PayloadWire {
  return deserializePayloadBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePayloadBytes(serialized: Uint8Array | BytesReader): PayloadWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const payloadType = bytesReader.readUInt8Enum(PayloadType, n => {
    throw new Error(`Cannot recognize PayloadType: ${n}`);
  });

  switch (payloadType) {
    case PayloadType.TokenTransfer:
      const recipient = deserializeCV(bytesReader) as PrincipalCV;
      const amount = intToBigInt(bytesReader.readBytes(8), false);
      const memo = deserializeMemoStringBytes(bytesReader);
      return createTokenTransferPayload(recipient, amount, memo);
    case PayloadType.ContractCall:
      const contractAddress = deserializeAddressBytes(bytesReader);
      const contractCallName = deserializeLPStringBytes(bytesReader);
      const functionName = deserializeLPStringBytes(bytesReader);
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
      const smartContractName = deserializeLPStringBytes(bytesReader);
      const codeBody = deserializeLPStringBytes(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody);

    case PayloadType.VersionedSmartContract: {
      const clarityVersion = bytesReader.readUInt8Enum(ClarityVersion, n => {
        throw new Error(`Cannot recognize ClarityVersion: ${n}`);
      });
      const smartContractName = deserializeLPStringBytes(bytesReader);
      const codeBody = deserializeLPStringBytes(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody, clarityVersion);
    }
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      return createPoisonPayload();
    case PayloadType.Coinbase: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      return createCoinbasePayload(coinbaseBytes);
    }
    case PayloadType.CoinbaseToAltRecipient: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      const altRecipient = deserializeCV(bytesReader) as PrincipalCV;
      return createCoinbasePayload(coinbaseBytes, altRecipient);
    }
    case PayloadType.NakamotoCoinbase: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      const recipient = deserializeCV(bytesReader) as OptionalCV<PrincipalCV>;
      const vrfProof = bytesReader.readBytes(VRF_PROOF_BYTES_LENGTH);
      return createNakamotoCoinbasePayload(coinbaseBytes, recipient, vrfProof);
    }
    case PayloadType.TenureChange:
      const tenureHash = bytesToHex(bytesReader.readBytes(20));
      const previousTenureHash = bytesToHex(bytesReader.readBytes(20));
      const burnViewHash = bytesToHex(bytesReader.readBytes(20));
      const previousTenureEnd = bytesToHex(bytesReader.readBytes(32));
      const previousTenureBlocks = bytesReader.readUInt32BE();
      const cause = bytesReader.readUInt8Enum(TenureChangeCause, n => {
        throw new Error(`Cannot recognize TenureChangeCause: ${n}`);
      });
      const publicKeyHash = bytesToHex(bytesReader.readBytes(20));
      return createTenureChangePayload(
        tenureHash,
        previousTenureHash,
        burnViewHash,
        previousTenureEnd,
        previousTenureBlocks,
        cause,
        publicKeyHash
      );
  }
}
