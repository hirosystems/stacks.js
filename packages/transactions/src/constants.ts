/**
 * Unsigned 32-bit integer
 */
enum ChainID {
  Testnet = 0x80000000,
  Mainnet = 0x00000001,
}

const DEFAULT_CHAIN_ID = ChainID.Mainnet;
const MAX_STRING_LENGTH_BYTES = 128;
const CLARITY_INT_SIZE = 128;
const CLARITY_INT_BYTE_SIZE = 16;
const COINBASE_BUFFER_LENGTH_BYTES = 32;
const RECOVERABLE_ECDSA_SIG_LENGTH_BYTES = 65;
const COMPRESSED_PUBKEY_LENGTH_BYTES = 32;
const UNCOMPRESSED_PUBKEY_LENGTH_BYTES = 64;
const MEMO_MAX_LENGTH_BYTES = 34;
const DEFAULT_CORE_NODE_API_URL = 'https://stacks-node-api.mainnet.stacks.co';

enum StacksMessageType {
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
  TransactionAuthField,
}

enum PayloadType {
  TokenTransfer = 0x00,
  SmartContract = 0x01,
  ContractCall = 0x02,
  PoisonMicroblock = 0x03,
  Coinbase = 0x04,
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
enum AnchorMode {
  /** The transaction MUST be included in an anchored block */
  OnChainOnly = 0x01,
  /** The transaction MUST be included in a microblock */
  OffChainOnly = 0x02,
  /** The leader can choose where to include the transaction (anchored block or microblock)*/
  Any = 0x03,
}

enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

const DEFAULT_TRANSACTION_VERSION = TransactionVersion.Mainnet;

enum PostConditionMode {
  Allow = 0x01,
  Deny = 0x02,
}

enum PostConditionType {
  STX = 0x00,
  Fungible = 0x01,
  NonFungible = 0x02,
}

enum AuthType {
  Standard = 0x04,
  Sponsored = 0x05,
}

enum AddressHashMode {
  // serialization modes for public keys to addresses.
  // We support four different modes due to legacy compatibility with Stacks v1 addresses:
  /** SingleSigHashMode - hash160(public-key), same as bitcoin's p2pkh */
  SerializeP2PKH = 0x00,
  /** MultiSigHashMode - hash160(multisig-redeem-script), same as bitcoin's multisig p2sh */
  SerializeP2SH = 0x01,
  /** SingleSigHashMode - hash160(segwit-program-00(p2pkh)), same as bitcoin's p2sh-p2wpkh */
  SerializeP2WPKH = 0x02,
  /** MultiSigHashMode - hash160(segwit-program-00(public-keys)), same as bitcoin's p2sh-p2wsh */
  SerializeP2WSH = 0x03,
}

type SingleSigHashMode = AddressHashMode.SerializeP2PKH | AddressHashMode.SerializeP2WPKH;
type MultiSigHashMode = AddressHashMode.SerializeP2SH | AddressHashMode.SerializeP2WSH;

enum AddressVersion {
  MainnetSingleSig = 22,
  MainnetMultiSig = 20,
  TestnetSingleSig = 26,
  TestnetMultiSig = 21,
}

enum PubKeyEncoding {
  Compressed = 0x00,
  Uncompressed = 0x01,
}

enum FungibleConditionCode {
  Equal = 0x01,
  Greater = 0x02,
  GreaterEqual = 0x03,
  Less = 0x04,
  LessEqual = 0x05,
}

enum NonFungibleConditionCode {
  DoesNotOwn = 0x10,
  Owns = 0x11,
}

enum PostConditionPrincipalID {
  Origin = 0x01,
  Standard = 0x02,
  Contract = 0x03,
}

enum AssetType {
  STX = 0x00,
  Fungible = 0x01,
  NonFungible = 0x02,
}

enum TxRejectedReason {
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
  ServerFailureDatabase = 'ServerFailureDatabase',
  ServerFailureOther = 'ServerFailureOther',
}

export {
  MAX_STRING_LENGTH_BYTES,
  CLARITY_INT_SIZE,
  CLARITY_INT_BYTE_SIZE,
  COINBASE_BUFFER_LENGTH_BYTES,
  DEFAULT_CHAIN_ID,
  DEFAULT_TRANSACTION_VERSION,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  COMPRESSED_PUBKEY_LENGTH_BYTES,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
  MEMO_MAX_LENGTH_BYTES,
  DEFAULT_CORE_NODE_API_URL,
  ChainID,
  StacksMessageType,
  PayloadType,
  AnchorMode,
  TransactionVersion,
  PostConditionMode,
  PostConditionType,
  PostConditionPrincipalID,
  AuthType,
  AddressHashMode,
  SingleSigHashMode,
  MultiSigHashMode,
  AddressVersion,
  PubKeyEncoding,
  FungibleConditionCode,
  NonFungibleConditionCode,
  AssetType,
  TxRejectedReason,
};
