import { bytesToHex, hexToBytes, IntegerType } from '@stacks/common';
import { c32address } from 'c32check';
import { StacksNodeApi } from './api';
import {
  createSingleSigSpendingCondition,
  createSpendingCondition,
  createSponsoredAuth,
  createStandardAuth,
  MultiSigSpendingCondition,
} from './authorization';
import { ClarityValue, PrincipalCV } from './clarity';
import {
  AddressHashMode,
  AddressVersion,
  AnchorMode,
  AnchorModeName,
  ClarityVersion,
  FungibleConditionCode,
  NonFungibleConditionCode,
  PayloadType,
  PostConditionMode,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  SingleSigHashMode,
  StacksMessageType,
  TransactionVersion,
  whenTransactionVersion,
} from './constants';
import { ClarityAbi, validateContractCall } from './contract-abi';
import { estimateFee, getAbi, getNonce } from './fetch';
import {
  createStacksPrivateKey,
  getPublicKey,
  pubKeyfromPrivKey,
  publicKeyFromBytes,
  publicKeyToAddress,
  publicKeyToString,
} from './keys';
import {
  networkFrom,
  STACKS_MAINNET,
  STACKS_TESTNET,
  StacksNetwork,
  StacksNetworkName,
} from './network';
import {
  createContractCallPayload,
  createSmartContractPayload,
  createTokenTransferPayload,
} from './payload';
import {
  createFungiblePostCondition,
  createNonFungiblePostCondition,
  createSTXPostCondition,
} from './postcondition';
import {
  AssetInfo,
  createContractPrincipal,
  createStandardPrincipal,
  FungiblePostCondition,
  NonFungiblePostCondition,
  PostCondition,
  STXPostCondition,
} from './postcondition-types';
import { TransactionSigner } from './signer';
import { StacksTransaction } from './transaction';
import { createLPList } from './types';
import { omit } from './utils';

export interface MultiSigOptions {
  numSignatures: number;
  publicKeys: string[];
  signerKeys?: string[];
}

/**
 * STX token transfer transaction options
 *
 * Note: Standard STX transfer does not allow post-conditions.
 */
export interface TokenTransferOptions {
  /** the address of the recipient of the token transfer */
  recipient: string | PrincipalCV;
  /** the amount to be transfered in microstacks */
  amount: IntegerType;
  /** the transaction fee in microstacks */
  fee?: IntegerType;
  /** the transaction nonce, which must be increased monotonically with each new transaction */
  nonce?: IntegerType;
  /** the network that the transaction will ultimately be broadcast to */
  network?: StacksNetworkName | StacksNetwork;
  /** the node/API used for estimating fee & nonce (using the `api.fetchFn` */
  api?: StacksNodeApi;
  /** the transaction anchorMode, which specifies whether it should be
   * included in an anchor block or a microblock */
  anchorMode: AnchorModeName | AnchorMode;
  /** an arbitrary string to include in the transaction, must be less than 34 bytes */
  memo?: string;
  /** set to true if another account is sponsoring the transaction (covering the transaction fee) */
  sponsored?: boolean;
}

export interface UnsignedTokenTransferOptions extends TokenTransferOptions {
  publicKey: string;
}

export interface SignedTokenTransferOptions extends TokenTransferOptions {
  senderKey: string;
}

export interface UnsignedMultiSigTokenTransferOptions extends TokenTransferOptions {
  numSignatures: number;
  publicKeys: string[];
}

export interface SignedMultiSigTokenTransferOptions extends TokenTransferOptions {
  numSignatures: number;
  publicKeys: string[];
  signerKeys: string[];
}

/**
 * Generates an unsigned Stacks token transfer transaction
 *
 * Returns a Stacks token transfer transaction.
 *
 * @param {UnsignedTokenTransferOptions | UnsignedMultiSigTokenTransferOptions} txOptions - an options object for the token transfer
 *
 * @return {Promise<StacksTransaction>}
 */
export async function makeUnsignedSTXTokenTransfer(
  txOptions: UnsignedTokenTransferOptions | UnsignedMultiSigTokenTransferOptions
): Promise<StacksTransaction> {
  const defaultOptions = {
    fee: BigInt(0),
    nonce: BigInt(0),
    network: STACKS_MAINNET,
    api: new StacksNodeApi({ network: txOptions.network }),
    memo: '',
    sponsored: false,
  };

  const options = Object.assign(defaultOptions, txOptions);

  const payload = createTokenTransferPayload(options.recipient, options.amount, options.memo);

  const network = networkFrom(options.network);
  const spendingCondition = createSpendingCondition(options);
  const authorization = options.sponsored
    ? createSponsoredAuth(spendingCondition)
    : createStandardAuth(spendingCondition);

  const transaction = new StacksTransaction(
    network.transactionVersion,
    authorization,
    payload,
    undefined, // no post conditions on STX transfers (see SIP-005)
    undefined, // no post conditions on STX transfers (see SIP-005)
    options.anchorMode,
    network.chainId
  );

  if (txOptions.fee == null) {
    const fee = await estimateFee({ transaction, api: options.api });
    transaction.setFee(fee);
  }

  if (txOptions.nonce == null) {
    const addressVersion =
      options.network.transactionVersion === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const address = c32address(addressVersion, transaction.auth.spendingCondition!.signer);
    const txNonce = await getNonce({ address, api: options.api });
    transaction.setNonce(txNonce);
  }

  return transaction;
}

/**
 * Generates a signed Stacks token transfer transaction
 *
 * Returns a signed Stacks token transfer transaction.
 *
 * @param {SignedTokenTransferOptions | SignedMultiSigTokenTransferOptions} txOptions - an options object for the token transfer
 *
 * @return {StacksTransaction}
 */
export async function makeSTXTokenTransfer(
  txOptions: SignedTokenTransferOptions | SignedMultiSigTokenTransferOptions
): Promise<StacksTransaction> {
  if ('senderKey' in txOptions) {
    // txOptions is SignedTokenTransferOptions
    const publicKey = publicKeyToString(getPublicKey(createStacksPrivateKey(txOptions.senderKey)));
    const options = omit(txOptions, 'senderKey');
    const transaction = await makeUnsignedSTXTokenTransfer({ publicKey, ...options });

    const privKey = createStacksPrivateKey(txOptions.senderKey);
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privKey);

    return transaction;
  } else {
    // txOptions is SignedMultiSigTokenTransferOptions
    const options = omit(txOptions, 'signerKeys');
    const transaction = await makeUnsignedSTXTokenTransfer(options);

    const signer = new TransactionSigner(transaction);
    let pubKeys = txOptions.publicKeys;
    for (const key of txOptions.signerKeys) {
      const pubKey = pubKeyfromPrivKey(key);
      pubKeys = pubKeys.filter(pk => pk !== bytesToHex(pubKey.data));
      signer.signOrigin(createStacksPrivateKey(key));
    }

    for (const key of pubKeys) {
      signer.appendOrigin(publicKeyFromBytes(hexToBytes(key)));
    }

    return transaction;
  }
}

/**
 * Contract deploy transaction options
 */
export interface BaseContractDeployOptions {
  clarityVersion?: ClarityVersion;
  contractName: string;
  /** the Clarity code to be deployed */
  codeBody: string;
  /** transaction fee in microstacks */
  fee?: IntegerType;
  /** the transaction nonce, which must be increased monotonically with each new transaction */
  nonce?: IntegerType;
  /** the network that the transaction will ultimately be broadcast to */
  network?: StacksNetworkName | StacksNetwork;
  /** the node/API used for estimating fee & nonce (using the `api.fetchFn` */
  api?: StacksNodeApi;
  /** the transaction anchorMode, which specifies whether it should be
   * included in an anchor block or a microblock */
  anchorMode: AnchorModeName | AnchorMode;
  /** the post condition mode, specifying whether or not post-conditions must fully cover all
   * transfered assets */
  postConditionMode?: PostConditionMode;
  /** a list of post conditions to add to the transaction */
  postConditions?: PostCondition[];
  /** set to true if another account is sponsoring the transaction (covering the transaction fee) */
  sponsored?: boolean;
}

export interface UnsignedContractDeployOptions extends BaseContractDeployOptions {
  /** a hex string of the public key of the transaction sender */
  publicKey: string;
}

export interface SignedContractDeployOptions extends BaseContractDeployOptions {
  senderKey: string;
}

/** @deprecated Use {@link SignedContractDeployOptions} or {@link UnsignedContractDeployOptions} instead. */
export interface ContractDeployOptions extends SignedContractDeployOptions {}

export interface UnsignedMultiSigContractDeployOptions extends BaseContractDeployOptions {
  numSignatures: number;
  publicKeys: string[];
}

export interface SignedMultiSigContractDeployOptions extends BaseContractDeployOptions {
  numSignatures: number;
  publicKeys: string[];
  signerKeys: string[];
}

/**
 * Generates a Clarity smart contract deploy transaction
 *
 * @param {SignedContractDeployOptions | SignedMultiSigContractDeployOptions} txOptions - an options object for the contract deploy
 *
 * Returns a signed Stacks smart contract deploy transaction.
 *
 * @return {StacksTransaction}
 */
export async function makeContractDeploy(
  txOptions: SignedContractDeployOptions | SignedMultiSigContractDeployOptions
): Promise<StacksTransaction> {
  if ('senderKey' in txOptions) {
    // txOptions is SignedContractDeployOptions
    const publicKey = publicKeyToString(getPublicKey(createStacksPrivateKey(txOptions.senderKey)));
    const options = omit(txOptions, 'senderKey');
    const transaction = await makeUnsignedContractDeploy({ publicKey, ...options });

    const privKey = createStacksPrivateKey(txOptions.senderKey);
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privKey);

    return transaction;
  } else {
    // txOptions is SignedMultiSigContractDeployOptions
    const options = omit(txOptions, 'signerKeys');
    const transaction = await makeUnsignedContractDeploy(options);

    const signer = new TransactionSigner(transaction);
    let pubKeys = txOptions.publicKeys;
    for (const key of txOptions.signerKeys) {
      const pubKey = pubKeyfromPrivKey(key);
      pubKeys = pubKeys.filter(pk => pk !== bytesToHex(pubKey.data));
      signer.signOrigin(createStacksPrivateKey(key));
    }

    for (const key of pubKeys) {
      signer.appendOrigin(publicKeyFromBytes(hexToBytes(key)));
    }

    return transaction;
  }
}

export async function makeUnsignedContractDeploy(
  txOptions: UnsignedContractDeployOptions | UnsignedMultiSigContractDeployOptions
): Promise<StacksTransaction> {
  const defaultOptions = {
    fee: BigInt(0),
    nonce: BigInt(0),
    network: STACKS_MAINNET,
    api: new StacksNodeApi({ network: txOptions.network }),
    postConditionMode: PostConditionMode.Deny,
    sponsored: false,
    clarityVersion: ClarityVersion.Clarity2,
  };

  const options = Object.assign(defaultOptions, txOptions);

  const payload = createSmartContractPayload(
    options.contractName,
    options.codeBody,
    options.clarityVersion
  );

  const network = networkFrom(options.network);
  const spendingCondition = createSpendingCondition(options);
  const authorization = options.sponsored
    ? createSponsoredAuth(spendingCondition)
    : createStandardAuth(spendingCondition);

  const postConditions: PostCondition[] = [];
  if (options.postConditions && options.postConditions.length > 0) {
    options.postConditions.forEach(postCondition => {
      postConditions.push(postCondition);
    });
  }
  const lpPostConditions = createLPList(postConditions);

  const transaction = new StacksTransaction(
    network.transactionVersion,
    authorization,
    payload,
    lpPostConditions,
    options.postConditionMode,
    options.anchorMode,
    network.chainId
  );

  if (txOptions.fee === undefined || txOptions.fee === null) {
    const fee = await estimateFee({ transaction, api: options.api });
    transaction.setFee(fee);
  }

  if (txOptions.nonce === undefined || txOptions.nonce === null) {
    const addressVersion =
      options.network.transactionVersion === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const address = c32address(addressVersion, transaction.auth.spendingCondition!.signer);
    const txNonce = await getNonce({ address, api: options.api });
    transaction.setNonce(txNonce);
  }

  return transaction;
}

/**
 * Contract function call transaction options
 */
export interface ContractCallOptions {
  /** the Stacks address of the contract */
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  /** transaction fee in microstacks */
  fee?: IntegerType;
  /** the transaction nonce, which must be increased monotonically with each new transaction */
  nonce?: IntegerType;
  /** the Stacks blockchain network that will ultimately be used to broadcast this transaction */
  network?: StacksNetworkName | StacksNetwork;
  /** the node/API used for estimating fee & nonce (using the `api.fetchFn` */
  api?: StacksNodeApi;
  /** the transaction anchorMode, which specifies whether it should be
   * included in an anchor block or a microblock */
  anchorMode: AnchorModeName | AnchorMode;
  /** the post condition mode, specifying whether or not post-conditions must fully cover all
   * transfered assets */
  postConditionMode?: PostConditionMode;
  /** a list of post conditions to add to the transaction */
  postConditions?: PostCondition[];
  /** set to true to validate that the supplied function args match those specified in
   * the published contract */
  validateWithAbi?: boolean | ClarityAbi;
  /** set to true if another account is sponsoring the transaction (covering the transaction fee) */
  sponsored?: boolean;
}

export interface UnsignedContractCallOptions extends ContractCallOptions {
  publicKey: string;
}

export interface SignedContractCallOptions extends ContractCallOptions {
  senderKey: string;
}

export interface UnsignedMultiSigContractCallOptions extends ContractCallOptions {
  numSignatures: number;
  publicKeys: string[];
}

export interface SignedMultiSigContractCallOptions extends ContractCallOptions {
  numSignatures: number;
  publicKeys: string[];
  signerKeys: string[];
}

/**
 * Generates an unsigned Clarity smart contract function call transaction
 *
 * @param {UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions} txOptions - an options object for the contract call
 *
 * @returns {Promise<StacksTransaction>}
 */
export async function makeUnsignedContractCall(
  txOptions: UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions
): Promise<StacksTransaction> {
  const defaultOptions = {
    fee: BigInt(0),
    nonce: BigInt(0),
    network: STACKS_MAINNET,
    api: new StacksNodeApi({ network: txOptions.network }),
    postConditionMode: PostConditionMode.Deny,
    sponsored: false,
  };

  const options = Object.assign(defaultOptions, txOptions);

  const payload = createContractCallPayload(
    options.contractAddress,
    options.contractName,
    options.functionName,
    options.functionArgs
  );

  if (options?.validateWithAbi) {
    let abi: ClarityAbi;
    if (typeof options.validateWithAbi === 'boolean') {
      if (options?.network) {
        abi = await getAbi(options);
      } else {
        throw new Error('Network option must be provided in order to validate with ABI');
      }
    } else {
      abi = options.validateWithAbi;
    }

    validateContractCall(payload, abi);
  }

  const network = networkFrom(options.network);
  const spendingCondition = createSpendingCondition(options);
  const authorization = options.sponsored
    ? createSponsoredAuth(spendingCondition)
    : createStandardAuth(spendingCondition);

  const postConditions: PostCondition[] = [];
  if (options.postConditions && options.postConditions.length > 0) {
    options.postConditions.forEach(postCondition => {
      postConditions.push(postCondition);
    });
  }

  const lpPostConditions = createLPList(postConditions);
  const transaction = new StacksTransaction(
    network.transactionVersion,
    authorization,
    payload,
    lpPostConditions,
    options.postConditionMode,
    options.anchorMode,
    network.chainId
  );

  if (txOptions.fee === undefined || txOptions.fee === null) {
    const fee = await estimateFee({ transaction, api: options.api });
    transaction.setFee(fee);
  }

  if (txOptions.nonce === undefined || txOptions.nonce === null) {
    const addressVersion =
      network.transactionVersion === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const address = c32address(addressVersion, transaction.auth.spendingCondition!.signer);
    const txNonce = await getNonce({ address, api: options.api });
    transaction.setNonce(txNonce);
  }

  return transaction;
}

/**
 * Generates a Clarity smart contract function call transaction
 *
 * @param {SignedContractCallOptions | SignedMultiSigContractCallOptions} txOptions - an options object for the contract function call
 *
 * Returns a signed Stacks smart contract function call transaction.
 *
 * @return {StacksTransaction}
 */
export async function makeContractCall(
  txOptions: SignedContractCallOptions | SignedMultiSigContractCallOptions
): Promise<StacksTransaction> {
  if ('senderKey' in txOptions) {
    const publicKey = publicKeyToString(getPublicKey(createStacksPrivateKey(txOptions.senderKey)));
    const options = omit(txOptions, 'senderKey');
    const transaction = await makeUnsignedContractCall({ publicKey, ...options });

    const privKey = createStacksPrivateKey(txOptions.senderKey);
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privKey);

    return transaction;
  } else {
    const options = omit(txOptions, 'signerKeys');
    const transaction = await makeUnsignedContractCall(options);

    const signer = new TransactionSigner(transaction);
    let pubKeys = txOptions.publicKeys;
    for (const key of txOptions.signerKeys) {
      const pubKey = pubKeyfromPrivKey(key);
      pubKeys = pubKeys.filter(pk => pk !== bytesToHex(pubKey.data));
      signer.signOrigin(createStacksPrivateKey(key));
    }

    for (const key of pubKeys) {
      signer.appendOrigin(publicKeyFromBytes(hexToBytes(key)));
    }

    return transaction;
  }
}

/**
 * Generates a STX post condition with a standard principal
 *
 * Returns a STX post condition object
 *
 * @param address - the c32check address
 * @param conditionCode - the condition code
 * @param amount - the amount of STX tokens (denoted in micro-STX)
 */
export function makeStandardSTXPostCondition(
  address: string,
  conditionCode: FungibleConditionCode,
  amount: IntegerType
): STXPostCondition {
  return createSTXPostCondition(createStandardPrincipal(address), conditionCode, amount);
}

/**
 * Generates a STX post condition with a contract principal
 *
 * Returns a STX post condition object
 *
 * @param address - the c32check address of the contract
 * @param contractName - the name of the contract
 * @param conditionCode - the condition code
 * @param amount - the amount of STX tokens (denoted in micro-STX)
 *
 * @return {STXPostCondition}
 */
export function makeContractSTXPostCondition(
  address: string,
  contractName: string,
  conditionCode: FungibleConditionCode,
  amount: IntegerType
): STXPostCondition {
  return createSTXPostCondition(
    createContractPrincipal(address, contractName),
    conditionCode,
    amount
  );
}

/**
 * Generates a fungible token post condition with a standard principal
 *
 * Returns a fungible token post condition object
 *
 * @param address - the c32check address
 * @param conditionCode - the condition code
 * @param amount - the amount of fungible tokens (in their respective base unit)
 * @param assetInfo - asset info describing the fungible token
 */
export function makeStandardFungiblePostCondition(
  address: string,
  conditionCode: FungibleConditionCode,
  amount: IntegerType,
  assetInfo: string | AssetInfo
): FungiblePostCondition {
  return createFungiblePostCondition(
    createStandardPrincipal(address),
    conditionCode,
    amount,
    assetInfo
  );
}

/**
 * Generates a fungible token post condition with a contract principal
 *
 * Returns a fungible token post condition object
 *
 * @param address - the c32check address
 * @param contractName - the name of the contract
 * @param conditionCode - the condition code
 * @param amount - the amount of fungible tokens (in their respective base unit)
 * @param assetInfo - asset info describing the fungible token
 */
export function makeContractFungiblePostCondition(
  address: string,
  contractName: string,
  conditionCode: FungibleConditionCode,
  amount: IntegerType,
  assetInfo: string | AssetInfo
): FungiblePostCondition {
  return createFungiblePostCondition(
    createContractPrincipal(address, contractName),
    conditionCode,
    amount,
    assetInfo
  );
}

/**
 * Generates a non-fungible token post condition with a standard principal
 *
 * Returns a non-fungible token post condition object
 *
 * @param {String} address - the c32check address
 * @param {FungibleConditionCode} conditionCode - the condition code
 * @param {AssetInfo} assetInfo - asset info describing the non-fungible token
 * @param {ClarityValue} assetId - asset identifier of the nft instance (typically a uint/buffer/string)
 *
 * @return {NonFungiblePostCondition}
 */
export function makeStandardNonFungiblePostCondition(
  address: string,
  conditionCode: NonFungibleConditionCode,
  assetInfo: string | AssetInfo,
  assetId: ClarityValue
): NonFungiblePostCondition {
  return createNonFungiblePostCondition(
    createStandardPrincipal(address),
    conditionCode,
    assetInfo,
    assetId
  );
}

/**
 * Generates a non-fungible token post condition with a contract principal
 *
 * Returns a non-fungible token post condition object
 *
 * @param {String} address - the c32check address
 * @param {String} contractName - the name of the contract
 * @param {FungibleConditionCode} conditionCode - the condition code
 * @param {AssetInfo} assetInfo - asset info describing the non-fungible token
 * @param {ClarityValue} assetId - asset identifier of the nft instance (typically a uint/buffer/string)
 *
 * @return {NonFungiblePostCondition}
 */
export function makeContractNonFungiblePostCondition(
  address: string,
  contractName: string,
  conditionCode: NonFungibleConditionCode,
  assetInfo: string | AssetInfo,
  assetId: ClarityValue
): NonFungiblePostCondition {
  return createNonFungiblePostCondition(
    createContractPrincipal(address, contractName),
    conditionCode,
    assetInfo,
    assetId
  );
}

/**
 * Sponsored transaction options
 */
export interface SponsorOptionsOpts {
  /** the origin-signed transaction */
  transaction: StacksTransaction;
  /** the sponsor's private key */
  sponsorPrivateKey: string;
  /** the transaction fee amount to sponsor */
  fee?: IntegerType;
  /** the nonce of the sponsor account */
  sponsorNonce?: IntegerType;
  /** the hashmode of the sponsor's address */
  sponsorAddressHashmode?: AddressHashMode;
  /** the Stacks blockchain network that this transaction will ultimately be broadcast to */
  network?: StacksNetworkName | StacksNetwork;
  /** the node/API used for estimating fee & nonce (using the `api.fetchFn` */
  api?: StacksNodeApi;
}

/**
 * Constructs and signs a sponsored transaction as the sponsor
 *
 * @param {SponsorOptionsOpts} sponsorOptions - the sponsor options object
 *
 * Returns a signed sponsored transaction.
 *
 * @return {ClarityValue}
 */
export async function sponsorTransaction(
  sponsorOptions: SponsorOptionsOpts
): Promise<StacksTransaction> {
  const defaultNetwork = whenTransactionVersion(sponsorOptions.transaction.version)({
    [TransactionVersion.Mainnet]: STACKS_MAINNET,
    [TransactionVersion.Testnet]: STACKS_TESTNET,
  }); // detect network from transaction version

  const defaultOptions = {
    fee: 0 as IntegerType,
    sponsorNonce: 0 as IntegerType,
    sponsorAddressHashmode: AddressHashMode.SerializeP2PKH as SingleSigHashMode,
    network: defaultNetwork,
    api: new StacksNodeApi({ network: defaultNetwork }),
  };

  const options = Object.assign(defaultOptions, sponsorOptions);

  const sponsorPubKey = pubKeyfromPrivKey(options.sponsorPrivateKey);

  if (sponsorOptions.fee == null) {
    let txFee: bigint | number = 0;
    switch (options.transaction.payload.payloadType) {
      case PayloadType.TokenTransfer:
      case PayloadType.SmartContract:
      case PayloadType.VersionedSmartContract:
      case PayloadType.ContractCall:
        txFee = BigInt(await estimateFee({ ...options }));
        break;
      default:
        throw new Error(
          `Sponsored transactions not supported for transaction type ${
            PayloadType[options.transaction.payload.payloadType]
          }`
        );
    }
    options.transaction.setFee(txFee);
    options.fee = txFee;
  }

  if (sponsorOptions.sponsorNonce == null) {
    const addressVersion = whenTransactionVersion(options.transaction.version)({
      [TransactionVersion.Mainnet]: AddressVersion.MainnetSingleSig,
      [TransactionVersion.Testnet]: AddressVersion.TestnetSingleSig,
    }); // detect address version from transaction version
    const address = publicKeyToAddress(addressVersion, sponsorPubKey);
    const sponsorNonce = await getNonce({ address, api: options.api });
    options.sponsorNonce = sponsorNonce;
  }

  const sponsorSpendingCondition = createSingleSigSpendingCondition(
    options.sponsorAddressHashmode,
    publicKeyToString(sponsorPubKey),
    options.sponsorNonce,
    options.fee
  );

  options.transaction.setSponsor(sponsorSpendingCondition);

  const privKey = createStacksPrivateKey(options.sponsorPrivateKey);
  const signer = TransactionSigner.createSponsorSigner(
    options.transaction,
    sponsorSpendingCondition
  );
  signer.signSponsor(privKey);

  return signer.transaction;
}

/**
 * Estimates transaction byte length
 * Context:
 * 1) Multi-sig transaction byte length increases by adding signatures
 *    which causes the incorrect fee estimation because the fee value is set while creating unsigned transaction
 * 2) Single-sig transaction byte length remain same due to empty message signature which allocates the space for signature
 * @param {transaction} - StacksTransaction object to be estimated
 * @return {number} Estimated transaction byte length
 */
export function estimateTransactionByteLength(transaction: StacksTransaction): number {
  const hashMode = transaction.auth.spendingCondition.hashMode;
  // List of Multi-sig transaction hash modes
  const multiSigHashModes = [AddressHashMode.SerializeP2SH, AddressHashMode.SerializeP2WSH];

  // Check if its a Multi-sig transaction
  if (multiSigHashModes.includes(hashMode)) {
    const multiSigSpendingCondition: MultiSigSpendingCondition = transaction.auth
      .spendingCondition as MultiSigSpendingCondition;

    // Find number of existing signatures if the transaction is signed or partially signed
    const existingSignatures = multiSigSpendingCondition.fields.filter(
      field => field.contents.type === StacksMessageType.MessageSignature
    ).length; // existingSignatures will be 0 if its a unsigned transaction

    // Estimate total signature bytes size required for this multi-sig transaction
    // Formula: totalSignatureLength = (signaturesRequired - existingSignatures) * (SIG_LEN_BYTES + 1 byte of type of signature)
    const totalSignatureLength =
      (multiSigSpendingCondition.signaturesRequired - existingSignatures) *
      (RECOVERABLE_ECDSA_SIG_LENGTH_BYTES + 1);

    return transaction.serialize().byteLength + totalSignatureLength;
  } else {
    // Single-sig transaction
    // Signature space already allocated by empty message signature
    return transaction.serialize().byteLength;
  }
}
