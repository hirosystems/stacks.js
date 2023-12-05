/**
 * The chain ID (unsigned 32-bit integer), used so transactions can't be replayed on other chains.
 * Similar to the {@link TransactionVersion}.
 */
export enum ChainID {
  Testnet = 0x80000000,
  Mainnet = 0x00000001,
}

export const DEFAULT_CHAIN_ID = ChainID.Mainnet;
export const MAX_STRING_LENGTH_BYTES = 128;
export const CLARITY_INT_SIZE = 128;
export const CLARITY_INT_BYTE_SIZE = 16;
export const COINBASE_BYTES_LENGTH = 32;
export const VRF_PROOF_BYTES_LENGTH = 80;
export const RECOVERABLE_ECDSA_SIG_LENGTH_BYTES = 65;
export const COMPRESSED_PUBKEY_LENGTH_BYTES = 32;
export const UNCOMPRESSED_PUBKEY_LENGTH_BYTES = 64;
export const MEMO_MAX_LENGTH_BYTES = 34;
export const DEFAULT_CORE_NODE_API_URL = 'https://api.mainnet.hiro.so';

// todo: add explicit enum values
/**
 * The type of message that is being serialized.
 * Used internally for serializing and deserializing messages.
 */
export enum StacksMessageType {
  Address,
  Principal,
  LengthPrefixedString,
  MemoString,
  AssetInfo,
  PostCondition,
  PublicKey,
  LengthPrefixedList,
  Payload,
  MessageSignature,
  StructuredDataSignature,
  TransactionAuthField,
}

type WhenMessageTypeMap<T> = Record<StacksMessageType, T>;

export function whenMessageType(messageType: StacksMessageType) {
  return <T>(messageTypeMap: WhenMessageTypeMap<T>): T => messageTypeMap[messageType];
}

/**
 * The type of transaction (payload) that is being serialized.
 * Used internally for serializing and deserializing transactions.
 */
export enum PayloadType {
  TokenTransfer = 0x00,
  SmartContract = 0x01,
  VersionedSmartContract = 0x06,
  ContractCall = 0x02,
  PoisonMicroblock = 0x03,
  Coinbase = 0x04,
  CoinbaseToAltRecipient = 0x05,
  TenureChange = 0x7,
  NakamotoCoinbase = 0x08,
}

/**
 * The version of Clarity used to deploy a smart contract.
 * Most methods will default to the latest available version of Clarity.
 */
export enum ClarityVersion {
  Clarity1 = 1,
  Clarity2 = 2,
}

/**
 * How a transaction should get appended to the Stacks blockchain.
 *
 * In the Stacks blockchain, there are two kinds of blocks: anchored
 * blocks and streaming microblocks. A transactions AnchorMode specifies
 * which kind of block it should be included in.
 *
 * For more information about the kinds of Stacks blocks and the various
 * AnchorModes, check out {@link https://github.com/stacksgov/sips/blob/main/sips/sip-001/sip-001-burn-election.md SIP 001} and
 * {@link https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md SIP 005}
 */
export enum AnchorMode {
  /** The transaction MUST be included in an anchored block */
  OnChainOnly = 0x01,
  /** The transaction MUST be included in a microblock */
  OffChainOnly = 0x02,
  /** The leader can choose where to include the transaction (anchored block or microblock)*/
  Any = 0x03,
}

export const AnchorModeNames = ['onChainOnly', 'offChainOnly', 'any'] as const;
export type AnchorModeName = (typeof AnchorModeNames)[number];

const AnchorModeMap = {
  [AnchorModeNames[0]]: AnchorMode.OnChainOnly,
  [AnchorModeNames[1]]: AnchorMode.OffChainOnly,
  [AnchorModeNames[2]]: AnchorMode.Any,
  [AnchorMode.OnChainOnly]: AnchorMode.OnChainOnly,
  [AnchorMode.OffChainOnly]: AnchorMode.OffChainOnly,
  [AnchorMode.Any]: AnchorMode.Any,
};

/** @ignore */
export function anchorModeFromNameOrValue(mode: AnchorModeName | AnchorMode): AnchorMode {
  if (mode in AnchorModeMap) return AnchorModeMap[mode];
  throw new Error(`Invalid anchor mode "${mode}", must be one of: ${AnchorModeNames.join(', ')}`);
}

/**
 * The transaction version, used so transactions can't be replayed on other networks.
 * Similar to the {@link ChainID}.
 * Used internally for serializing and deserializing transactions.
 */
export enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

export const DEFAULT_TRANSACTION_VERSION = TransactionVersion.Mainnet;

/**
 * How to treat unspecified transfers of a transaction.
 * Used for creating transactions.
 *
 * Post-conditions are **always** be validated by nodes, regardless of the {@link PostConditionMode}.
 * `PostConditionMode.Allow` will allow additional (aka unspecified) transfers, while `PostConditionMode.Deny` will not.
 */
export enum PostConditionMode {
  /** `Allow` — Allow unspecified transfers */
  Allow = 0x01,
  /** `Deny` — Do not allow unspecified transfers */
  Deny = 0x02,
}

/**
 * The type of asset a post-condition is referring to.
 * Used for serializing post-conditions.
 */
export enum PostConditionType {
  STX = 0x00,
  Fungible = 0x01,
  NonFungible = 0x02,
}

/**
 * The sponsorship mode of a transaction.
 *
 * Specifies whether a transaction is sponsored or not.
 */
export enum AuthType {
  /** `Standard` (not sponsored) — The transaction is not sponsored. The sender will need to spend fees. */
  Standard = 0x04,
  /** `Sponsored` — The transaction is sponsored. The sponsor will spend fees on behalf of the sender. */
  Sponsored = 0x05,
}

/**
 * Serialization modes for public keys to addresses.
 * Four different modes are supported due to legacy compatibility with Stacks v1 addresses.
 */
export enum AddressHashMode {
  /** `SingleSigHashMode` — hash160(public-key), same as bitcoin's p2pkh */
  SerializeP2PKH = 0x00,
  /** `MultiSigHashMode` — hash160(multisig-redeem-script), same as bitcoin's multisig p2sh */
  SerializeP2SH = 0x01,
  /** `SingleSigHashMode` — hash160(segwit-program-00(p2pkh)), same as bitcoin's p2sh-p2wpkh */
  SerializeP2WPKH = 0x02,
  /** `MultiSigHashMode` — hash160(segwit-program-00(public-keys)), same as bitcoin's p2sh-p2wsh */
  SerializeP2WSH = 0x03,
}

export type SingleSigHashMode = AddressHashMode.SerializeP2PKH | AddressHashMode.SerializeP2WPKH;
export type MultiSigHashMode = AddressHashMode.SerializeP2SH | AddressHashMode.SerializeP2WSH;

/**
 * Address versions for identifying address types in an encoded Stacks address.
 * The address version is a single byte, indicating the address type.
 * Every Stacks address starts with `S` followed by a single character indicating the address version.
 * The second character is the c32-encoded AddressVersion byte.
 */
export enum AddressVersion {
  /** `P` — A single-sig address for mainnet (starting with `SP`) */
  MainnetSingleSig = 22,
  /** `M` — A multi-sig address for mainnet (starting with `SM`) */
  MainnetMultiSig = 20,
  /** `T` — A single-sig address for testnet (starting with `ST`) */
  TestnetSingleSig = 26,
  /** `N` — A multi-sig address for testnet (starting with `SN`) */
  TestnetMultiSig = 21,
}

// todo: try to remove this
export enum PubKeyEncoding {
  Compressed = 0x00,
  Uncompressed = 0x01,
}

/**
 * The type of fungible token post-condition comparison.
 * Used for serializing post-conditions.
 */
export enum FungibleConditionCode {
  Equal = 0x01,
  Greater = 0x02,
  GreaterEqual = 0x03,
  Less = 0x04,
  LessEqual = 0x05,
}

/**
 * The type of non-fungible token post-condition comparison.
 * Used for serializing post-conditions.
 */
export enum NonFungibleConditionCode {
  Sends = 0x10,
  DoesNotSend = 0x11,
}

/**
 * The type of sender for a post-condition.
 */
export enum PostConditionPrincipalID {
  Origin = 0x01,
  Standard = 0x02,
  Contract = 0x03,
}

/**
 * The type of asset used in a post-condition.
 */
export enum AssetType {
  STX = 0x00,
  Fungible = 0x01,
  NonFungible = 0x02,
}

// todo: refactor this, if only used in one place, just use a string
/** @ignore */
export enum TxRejectedReason {
  Serialization = 'Serialization',
  Deserialization = 'Deserialization',
  SignatureValidation = 'SignatureValidation',
  FeeTooLow = 'FeeTooLow',
  BadNonce = 'BadNonce',
  NotEnoughFunds = 'NotEnoughFunds',
  NoSuchContract = 'NoSuchContract',
  NoSuchPublicFunction = 'NoSuchPublicFunction',
  BadFunctionArgument = 'BadFunctionArgument',
  ContractAlreadyExists = 'ContractAlreadyExists',
  PoisonMicroblocksDoNotConflict = 'PoisonMicroblocksDoNotConflict',
  PoisonMicroblockHasUnknownPubKeyHash = 'PoisonMicroblockHasUnknownPubKeyHash',
  PoisonMicroblockIsInvalid = 'PoisonMicroblockIsInvalid',
  BadAddressVersionByte = 'BadAddressVersionByte',
  NoCoinbaseViaMempool = 'NoCoinbaseViaMempool',
  ServerFailureNoSuchChainTip = 'ServerFailureNoSuchChainTip',
  TooMuchChaining = 'TooMuchChaining',
  ConflictingNonceInMempool = 'ConflictingNonceInMempool',
  BadTransactionVersion = 'BadTransactionVersion',
  TransferRecipientCannotEqualSender = 'TransferRecipientCannotEqualSender',
  TransferAmountMustBePositive = 'TransferAmountMustBePositive',
  ServerFailureDatabase = 'ServerFailureDatabase',
  EstimatorError = 'EstimatorError',
  TemporarilyBlacklisted = 'TemporarilyBlacklisted',
  ServerFailureOther = 'ServerFailureOther',
}
