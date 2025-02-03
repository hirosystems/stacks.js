import { IntegerType, hexToBytes, intToBigInt } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import { ClarityType, ClarityValue, OptionalCV, PrincipalCV, principalCV } from '../clarity';
import {
  AddressVersion,
  COINBASE_BYTES_LENGTH,
  ClarityVersion,
  MAX_STRING_LENGTH_BYTES,
  MEMO_MAX_LENGTH_BYTES,
  PayloadType,
  PostConditionPrincipalId,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  TenureChangeCause,
  VRF_PROOF_BYTES_LENGTH,
} from '../constants';
import { exceedsMaxLengthBytes } from '../utils';
import {
  AddressWire,
  AssetWire,
  CoinbasePayloadToAltRecipient,
  CoinbasePayloadWire,
  ContractCallPayload,
  ContractPrincipalWire,
  LengthPrefixedList,
  LengthPrefixedStringWire,
  MemoStringWire,
  MessageSignatureWire,
  NakamotoCoinbasePayloadWire,
  PoisonPayloadWire,
  SmartContractPayloadWire,
  StacksWire,
  StacksWireType,
  StandardPrincipalWire,
  TenureChangePayloadWire,
  TokenTransferPayloadWire,
  TransactionAuthFieldContentsWire,
  TransactionAuthFieldWire,
  VersionedSmartContractPayloadWire,
} from './types';

export function createEmptyAddress(): AddressWire {
  return {
    type: StacksWireType.Address,
    version: AddressVersion.MainnetSingleSig,
    hash160: '0'.repeat(40),
  };
}

export function createMemoString(content: string): MemoStringWire {
  if (content && exceedsMaxLengthBytes(content, MEMO_MAX_LENGTH_BYTES)) {
    throw new Error(`Memo exceeds maximum length of ${MEMO_MAX_LENGTH_BYTES} bytes`);
  }
  return { type: StacksWireType.MemoString, content };
}

export function createLPList<T extends StacksWire>(
  values: T[],
  lengthPrefixBytes?: number
): LengthPrefixedList<T> {
  return {
    type: StacksWireType.LengthPrefixedList,
    lengthPrefixBytes: lengthPrefixBytes || 4,
    values,
  };
}

export function createMessageSignature(signature: string): MessageSignatureWire {
  const length = hexToBytes(signature).byteLength;
  if (length != RECOVERABLE_ECDSA_SIG_LENGTH_BYTES) {
    throw Error('Invalid signature');
  }

  return {
    type: StacksWireType.MessageSignature,
    data: signature,
  };
}

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
    amount: intToBigInt(amount),
    memo: memo ?? createMemoString(''),
  };
}

export function createContractCallPayload(
  contractAddress: string | AddressWire,
  contractName: string | LengthPrefixedStringWire,
  functionName: string | LengthPrefixedStringWire,
  functionArgs: ClarityValue[]
): ContractCallPayload {
  if (typeof contractName === 'string') {
    contractName = createLPString(contractName);
  }
  if (typeof functionName === 'string') {
    functionName = createLPString(functionName);
  }

  return {
    type: StacksWireType.Payload,
    payloadType: PayloadType.ContractCall,
    contractAddress:
      typeof contractAddress === 'string' ? createAddress(contractAddress) : contractAddress,
    contractName,
    functionName,
    functionArgs,
  };
}

export function codeBodyString(content: string): LengthPrefixedStringWire {
  return createLPString(content, 4, 100_000);
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

export function createPoisonPayload(): PoisonPayloadWire {
  return { type: StacksWireType.Payload, payloadType: PayloadType.PoisonMicroblock };
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

export function createLPString(content: string): LengthPrefixedStringWire;
export function createLPString(
  content: string,
  lengthPrefixBytes: number
): LengthPrefixedStringWire;
export function createLPString(
  content: string,
  lengthPrefixBytes: number,
  maxLengthBytes: number
): LengthPrefixedStringWire;
/** @ignore */
export function createLPString(
  content: string,
  lengthPrefixBytes?: number,
  maxLengthBytes?: number
): LengthPrefixedStringWire {
  const prefixLength = lengthPrefixBytes || 1;
  const maxLength = maxLengthBytes || MAX_STRING_LENGTH_BYTES;
  if (exceedsMaxLengthBytes(content, maxLength)) {
    throw new Error(`String length exceeds maximum bytes ${maxLength}`);
  }
  return {
    type: StacksWireType.LengthPrefixedString,
    content,
    lengthPrefixBytes: prefixLength,
    maxLengthBytes: maxLength,
  };
}

/** @ignore */
export function createAsset(
  addressString: string,
  contractName: string,
  assetName: string
): AssetWire {
  return {
    type: StacksWireType.Asset,
    address: createAddress(addressString),
    contractName: createLPString(contractName),
    assetName: createLPString(assetName),
  };
}

/** @ignore */
export function createAddress(c32AddressString: string): AddressWire {
  const addressData = c32addressDecode(c32AddressString);
  return {
    type: StacksWireType.Address,
    version: addressData[0],
    hash160: addressData[1],
  };
}

/** @ignore */
export function createContractPrincipal(
  addressString: string,
  contractName: string
): ContractPrincipalWire {
  const addr = createAddress(addressString);
  const name = createLPString(contractName);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Contract,
    address: addr,
    contractName: name,
  };
}

/** @ignore */
export function createStandardPrincipal(addressString: string): StandardPrincipalWire {
  const addr = createAddress(addressString);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Standard,
    address: addr,
  };
}

export function createTransactionAuthField(
  pubKeyEncoding: PubKeyEncoding,
  contents: TransactionAuthFieldContentsWire
): TransactionAuthFieldWire {
  return {
    pubKeyEncoding,
    type: StacksWireType.TransactionAuthField,
    contents,
  };
}
