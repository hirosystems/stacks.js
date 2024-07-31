import { ApiParam, IntegerType, PublicKey, intToBigInt, utf8ToBytes } from '@stacks/common';
import { StacksNetwork } from '@stacks/network';
import {
  ClarityType,
  ClarityValue,
  NonFungiblePostCondition,
  PostCondition,
  ResponseErrorCV,
  StacksTransaction,
  StxPostCondition,
  UnsignedContractCallOptions,
  bufferCV,
  bufferCVFromString,
  cvToString,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  getCVTypeString,
  hash160,
  makeRandomPrivKey,
  makeUnsignedContractCall,
  noneCV,
  publicKeyToAddress,
  someCV,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { decodeFQN, getZonefileHash } from './utils';

export const BNS_CONTRACT_NAME = 'bns';

export interface PriceFunction {
  base: IntegerType;
  coefficient: IntegerType;
  b1: IntegerType;
  b2: IntegerType;
  b3: IntegerType;
  b4: IntegerType;
  b5: IntegerType;
  b6: IntegerType;
  b7: IntegerType;
  b8: IntegerType;
  b9: IntegerType;
  b10: IntegerType;
  b11: IntegerType;
  b12: IntegerType;
  b13: IntegerType;
  b14: IntegerType;
  b15: IntegerType;
  b16: IntegerType;
  nonAlphaDiscount: IntegerType;
  noVowelDiscount: IntegerType;
}

export interface BnsContractCallOptions {
  functionName: string;
  functionArgs: ClarityValue[];
  publicKey: PublicKey;
  network: StacksNetwork;
  postConditions?: PostCondition[];
}

async function makeBnsContractCall(options: BnsContractCallOptions): Promise<StacksTransaction> {
  const txOptions: UnsignedContractCallOptions = {
    contractAddress: options.network.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    publicKey: options.publicKey,
    validateWithAbi: false,
    network: options.network,
    postConditions: options.postConditions,
  };

  return makeUnsignedContractCall(txOptions);
}

export interface BnsReadOnlyOptions {
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
  network: StacksNetwork;
}

async function callReadOnlyBnsFunction(
  options: BnsReadOnlyOptions & ApiParam
): Promise<ClarityValue> {
  return fetchCallReadOnlyFunction({
    contractAddress: options.network.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: options.functionName,
    senderAddress: options.senderAddress,
    functionArgs: options.functionArgs,
    api: options.api,
  });
}

/**
 * Can register name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name ("name.namespace") to check
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface CanRegisterNameOptions {
  fullyQualifiedName: string;
  network: StacksNetwork;
}

/**
 * Check if name can be registered
 *
 * @param {string} fullyQualifiedName - the fully qualified name to check
 * @param {StacksNetwork} network - the Stacks network to broadcast transaction to
 *
 * @returns {Promise} that resolves to true if the operation succeeds
 */
export async function canRegisterName({
  fullyQualifiedName,
  network,
}: CanRegisterNameOptions): Promise<boolean> {
  const bnsFunctionName = 'can-name-be-registered';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot register a subdomain using registerName');
  }

  // Create a random address as input to read-only function call
  // Not used by BNS contract function but required by core node API
  // https://github.com/blockstack/stacks-blockchain/blob/master/src/net/http.rs#L1796
  const randomPrivateKey = makeRandomPrivKey();
  const randomAddress = getAddressFromPrivateKey(randomPrivateKey);

  return callReadOnlyBnsFunction({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      return responseCV.value.type === ClarityType.BoolTrue;
    } else {
      return false;
    }
  });
}

/**
 * Get namespace price options
 *
 * @param  {String} namespace - the namespace to get the price of
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface GetNamespacePriceOptions {
  namespace: string;
  network: StacksNetwork;
}

/**
 * Get price of namespace registration in microstacks
 *
 * @param {string} namespace - the namespace
 * @param {StacksNetwork} network - the Stacks network to use
 *
 * @returns {Promise} that resolves to a BN object number of microstacks if the operation succeeds
 */
export async function getNamespacePrice({
  namespace,
  network,
}: GetNamespacePriceOptions): Promise<bigint> {
  const bnsFunctionName = 'get-namespace-price';

  // Create a random address as input to read-only function call
  // Not used by BNS contract function but required by core node API
  // https://github.com/blockstack/stacks-blockchain/blob/master/src/net/http.rs#L1796
  const randomPrivateKey = makeRandomPrivKey();
  const randomAddress = getAddressFromPrivateKey(randomPrivateKey);

  return callReadOnlyBnsFunction({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Int || responseCV.value.type === ClarityType.UInt) {
        return BigInt(responseCV.value.value);
      } else {
        throw new Error('Response did not contain a number');
      }
    } else if (responseCV.type === ClarityType.ResponseErr) {
      throw new Error(cvToString(responseCV.value));
    } else {
      throw new Error(`Unexpected Clarity Value type: ${getCVTypeString(responseCV)}`);
    }
  });
}

/**
 * Get name price options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name ("name.namespace") to get the price of
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface GetNamePriceOptions {
  fullyQualifiedName: string;
  network: StacksNetwork;
}

/**
 * Get price of name registration in microstacks
 *
 * @param {string} fullyQualifiedName - the fully qualified name
 * @param {StacksNetwork} network - the Stacks network to use
 *
 * @returns {Promise} that resolves to a BN object number of microstacks if the operation succeeds
 */
export async function getNamePrice({
  fullyQualifiedName,
  network,
}: GetNamePriceOptions): Promise<bigint> {
  const bnsFunctionName = 'get-name-price';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot get subdomain name price');
  }

  // Create a random address as input to read-only function call
  // Not used by BNS contract function but required by core node API
  // https://github.com/blockstack/stacks-blockchain/blob/master/src/net/http.rs#L1796
  const randomPrivateKey = makeRandomPrivKey();
  const randomAddress = getAddressFromPrivateKey(randomPrivateKey);

  return callReadOnlyBnsFunction({
    functionName: bnsFunctionName,
    senderAddress: randomAddress,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network,
  }).then((responseCV: ClarityValue) => {
    if (responseCV.type === ClarityType.ResponseOk) {
      if (responseCV.value.type === ClarityType.Int || responseCV.value.type === ClarityType.UInt) {
        return BigInt(responseCV.value.value);
      } else {
        throw new Error('Response did not contain a number');
      }
    } else {
      const errorResponse = responseCV as ResponseErrorCV;
      throw new Error(cvToString(errorResponse.value));
    }
  });
}

/**
 * Preorder namespace options
 */
export interface PreorderNamespaceOptions {
  /** the namespace to preorder */
  namespace: string;
  /** salt used to generate the preorder namespace hash */
  salt: string;
  /** amount of STX to burn for the registration */
  stxToBurn: IntegerType;
  /** the private key to sign the transaction */
  publicKey: string;
  /** the Stacks blockchain network to use */
  network: StacksNetwork;
}

/**
 * Generates a namespace preorder transaction.
 * First step in registering a namespace. This transaction does not reveal the namespace that is
 * about to be registered. And it sets the amount of STX to be burned for the registration.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {PreorderNamespaceOptions} options - an options object for the preorder
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildPreorderNamespaceTx({
  namespace,
  salt,
  stxToBurn,
  publicKey,
  network,
}: PreorderNamespaceOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'namespace-preorder';
  const saltedNamespaceBytes = utf8ToBytes(`${namespace}${salt}`);
  const hashedSaltedNamespace = hash160(saltedNamespaceBytes);

  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: intToBigInt(stxToBurn),
  };

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedNamespace), uintCV(stxToBurn)],
    publicKey,
    network,
    postConditions: [burnSTXPostCondition],
  });
}

/**
 * Reveal namespace options
 */
export interface RevealNamespaceOptions {
  /** the namespace to reveal */
  namespace: string;
  /** salt used to generate the preorder namespace hash */
  salt: string;
  /** an object containing the price function for the namespace */
  priceFunction: PriceFunction;
  /** the number of blocks name registrations are valid for in the namespace */
  lifetime: IntegerType;
  /** the STX address used for name imports */
  namespaceImportAddress: string;
  /** the key to sign the transaction */
  publicKey: string;
  /** the Stacks blockchain network to use */
  network: StacksNetwork;
}

/**
 * Generates a namespace reveal transaction.
 * Second step in registering a namespace.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {RevealNamespaceOptions} options - an options object for the reveal
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildRevealNamespaceTx({
  namespace,
  salt,
  priceFunction,
  lifetime,
  namespaceImportAddress,
  publicKey,
  network,
}: RevealNamespaceOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'namespace-reveal';

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(salt),
      uintCV(priceFunction.base),
      uintCV(priceFunction.coefficient),
      uintCV(priceFunction.b1),
      uintCV(priceFunction.b2),
      uintCV(priceFunction.b3),
      uintCV(priceFunction.b4),
      uintCV(priceFunction.b5),
      uintCV(priceFunction.b6),
      uintCV(priceFunction.b7),
      uintCV(priceFunction.b8),
      uintCV(priceFunction.b9),
      uintCV(priceFunction.b10),
      uintCV(priceFunction.b11),
      uintCV(priceFunction.b12),
      uintCV(priceFunction.b13),
      uintCV(priceFunction.b14),
      uintCV(priceFunction.b15),
      uintCV(priceFunction.b16),
      uintCV(priceFunction.nonAlphaDiscount),
      uintCV(priceFunction.noVowelDiscount),
      uintCV(lifetime),
      standardPrincipalCV(namespaceImportAddress),
    ],
    publicKey,
    network,
  });
}

/**
 * Namespace name import options
 *
 * @param  {String} namespace - the namespace to import name into
 * @param  {String} name - the name to import
 * @param  {String} beneficiary - the address to register the name to
 * @param  {String} zonefileHash - the zonefile hash to register
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface ImportNameOptions {
  namespace: string;
  name: string;
  beneficiary: string;
  zonefile: string;
  publicKey: string;
  network: StacksNetwork;
}

/**
 * Generates a namespace name import transaction.
 * An optional step in namespace registration.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {ImportNameOptions} options - an options object for the name import
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildImportNameTx({
  namespace,
  name,
  beneficiary,
  zonefile,
  publicKey,
  network,
}: ImportNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-import';
  const zonefileHash = getZonefileHash(zonefile);

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(beneficiary),
      bufferCV(zonefileHash),
    ],
    publicKey,
    network,
  });
}

/**
 * Ready namespace options
 *
 * @param  {String} namespace - the namespace to ready
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface ReadyNamespaceOptions {
  namespace: string;
  publicKey: string;
  network: StacksNetwork;
}

/**
 * Generates a ready namespace transaction.
 * Final step in namespace registration. This completes the namespace registration and
 * makes the namespace available for name registrations.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {ReadyNamespaceOptions} options - an options object for the namespace ready transaction
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildReadyNamespaceTx({
  namespace,
  publicKey,
  network,
}: ReadyNamespaceOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'namespace-ready';

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    publicKey,
    network,
  });
}

/**
 * Preorder name options
 */
export interface PreorderNameOptions {
  /** the fully qualified name to preorder including the namespace (myName.id) */
  fullyQualifiedName: string;
  /** salt used to generate the preorder name hash */
  salt: string;
  /** amount of STX to burn for the registration */
  stxToBurn: IntegerType;
  /** the private key to sign the transaction */
  publicKey: PublicKey;
  /** the Stacks blockchain network to use */
  network: StacksNetwork;
}

/**
 * Generates a name preorder transaction.
 * First step in registering a name. This transaction does not reveal the name that is
 * about to be registered. And it sets the amount of STX to be burned for the registration.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {PreorderNameOptions} options - an options object for the preorder
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildPreorderNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  publicKey,
  network,
}: PreorderNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-preorder';
  const { subdomain } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot preorder a subdomain using preorderName()');
  }
  const saltedNamesBytes = utf8ToBytes(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBytes);

  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: intToBigInt(stxToBurn),
  };

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName), uintCV(stxToBurn)],
    publicKey,
    network,
    postConditions: [burnSTXPostCondition],
  });
}

/**
 * Register name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to preorder including the
 *                                        namespace (myName.id)
 * @param  {String} salt - salt used to generate the preorder name hash
 * @param  {String} zonefile - the zonefile to register with the name
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface RegisterNameOptions {
  fullyQualifiedName: string;
  salt: string;
  zonefile: string;
  publicKey: PublicKey;
  network: StacksNetwork;
}

/**
 * Generates a name registration transaction.
 * Second and final step in registering a name.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {RegisterNameOptions} options - an options object for the registration
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildRegisterNameTx({
  fullyQualifiedName,
  salt,
  zonefile,
  publicKey,
  network,
}: RegisterNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-register';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot register a subdomain using registerName()');
  }

  const zonefileHash = getZonefileHash(zonefile);

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(salt),
      bufferCV(zonefileHash),
    ],
    network,
    publicKey,
  });
}

/**
 * Update name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to update including the
 *                                        namespace (myName.id)
 * @param  {String} zonefile - the zonefile to register with the name
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface UpdateNameOptions {
  fullyQualifiedName: string;
  zonefile: string;
  publicKey: string;
  network: StacksNetwork;
}

/**
 * Generates a name update transaction.
 * This changes the zonefile for the registered name.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {UpdateNameOptions} options - an options object for the update
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildUpdateNameTx({
  fullyQualifiedName,
  zonefile,
  publicKey,
  network,
}: UpdateNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-update';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot update a subdomain using updateName()');
  }
  const zonefileHash = getZonefileHash(zonefile);

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name), bufferCV(zonefileHash)],
    publicKey,
    network,
  });
}

/**
 * Transfer name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to transfer including the
 *                                        namespace (myName.id)
 * @param  {String} newOwnerAddress - the recipient address of the name transfer
 * @param  {String} zonefile - the optional zonefile to register with the name
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface TransferNameOptions {
  fullyQualifiedName: string;
  newOwnerAddress: string;
  publicKey: string;
  network: StacksNetwork;
  zonefile?: string;
}

/**
 * Generates a name transfer transaction.
 * This changes the owner of the registered name.
 *
 * Since the underlying NFT will be transferred,
 * you will be required to add a post-condition to this
 * transaction before broadcasting it.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {TransferNameOptions} options - an options object for the transfer
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildTransferNameTx({
  fullyQualifiedName,
  newOwnerAddress,
  zonefile,
  publicKey,
  network,
}: TransferNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-transfer';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot transfer a subdomain using transferName()');
  }

  const functionArgs = [
    bufferCVFromString(namespace),
    bufferCVFromString(name),
    standardPrincipalCV(newOwnerAddress),
    zonefile ? someCV(bufferCV(getZonefileHash(zonefile))) : noneCV(),
  ];
  const postConditionSender: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };
  const postConditionReceiver: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: newOwnerAddress,
    condition: 'not-sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs,
    publicKey,
    network,
    postConditions: [postConditionSender, postConditionReceiver],
  });
}

/**
 * Revoke name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to revoke including the
 *                                        namespace (myName.id)
 * @param  {String} publicKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to use
 */
export interface RevokeNameOptions {
  fullyQualifiedName: string;
  publicKey: string;
  network: StacksNetwork;
}

/**
 * Generates a name revoke transaction.
 * This revokes a name registration.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {RevokeNameOptions} options - an options object for the revoke
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildRevokeNameTx({
  fullyQualifiedName,
  publicKey,
  network,
}: RevokeNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-revoke';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot revoke a subdomain using revokeName()');
  }

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    publicKey,
    network,
  });
}

/**
 * Renew name options
 */
export interface RenewNameOptions {
  /** the fully qualified name to renew including the namespace (myName.id) */
  fullyQualifiedName: string;
  /** amount of STX to burn for the registration */
  stxToBurn: IntegerType;
  /** the private key to sign the transaction */
  publicKey: string;
  /** the Stacks blockchain network to use */
  network: StacksNetwork;
  /** optionally choose a new owner address */
  newOwnerAddress?: string;
  /** optionally update the zonefile hash */
  zonefile?: string;
}

/**
 * Generates a name renew transaction.
 * This renews a name registration.
 *
 * Resolves to the generated StacksTransaction
 *
 * @param  {RenewNameOptions} options - an options object for the renew
 *
 * @return {Promise<StacksTransaction>}
 */
export async function buildRenewNameTx({
  fullyQualifiedName,
  stxToBurn,
  newOwnerAddress,
  zonefile,
  publicKey,
  network,
}: RenewNameOptions): Promise<StacksTransaction> {
  const bnsFunctionName = 'name-renewal';
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error('Cannot renew a subdomain using renewName()');
  }

  const functionArgs = [
    bufferCVFromString(namespace),
    bufferCVFromString(name),
    uintCV(stxToBurn),
    newOwnerAddress ? someCV(standardPrincipalCV(newOwnerAddress)) : noneCV(),
    zonefile ? someCV(bufferCV(getZonefileHash(zonefile))) : noneCV(),
  ];
  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: intToBigInt(stxToBurn),
  };

  return makeBnsContractCall({
    functionName: bnsFunctionName,
    functionArgs,
    publicKey,
    network,
    postConditions: [burnSTXPostCondition],
  });
}
