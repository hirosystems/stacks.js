import { utf8ToBytes } from '@stacks/common';
import { STACKS_TESTNET } from '@stacks/network';
import {
  NonFungiblePostCondition,
  StxPostCondition,
  bufferCV,
  bufferCVFromString,
  falseCV,
  hash160,
  noneCV,
  publicKeyToAddress,
  responseErrorCV,
  responseOkCV,
  someCV,
  standardPrincipalCV,
  trueCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import fetchMock from 'jest-fetch-mock';
import { BNS_CONTRACT_NAME, PriceFunction } from '../src';
import { decodeFQN, getZonefileHash } from '../src/utils';

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

test('canRegisterName true', async () => {
  const fullyQualifiedName = 'test.id';

  const trueFunctionCallResponse = responseOkCV(trueCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(trueFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network });

  const bnsFunctionName = 'can-name-be-registered';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[1])),
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network: STACKS_TESTNET,
  };

  expect(result).toEqual(true);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName false', async () => {
  const fullyQualifiedName = 'test.id';

  const falseFunctionCallResponse = responseOkCV(falseCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(falseFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network });

  const bnsFunctionName = 'can-name-be-registered';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[1])),
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network: STACKS_TESTNET,
  };

  expect(result).toEqual(false);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName error', async () => {
  const fullyQualifiedName = 'test.id';

  const errorFunctionCallResponse = responseErrorCV(bufferCV(utf8ToBytes('error')));
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(errorFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network });

  const bnsFunctionName = 'can-name-be-registered';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[1])),
      bufferCV(utf8ToBytes(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network: STACKS_TESTNET,
  };

  expect(result).toEqual(false);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamespacePrice', async () => {
  const namespace = 'id';

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namespacePriceResponse = responseOkCV(uintCV(10));
  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(namespacePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { getNamespacePrice } = require('../src');
  const result = await getNamespacePrice({ namespace, network });

  const bnsFunctionName = 'get-namespace-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [bufferCVFromString(namespace)],
    network: STACKS_TESTNET,
  };

  expect(result.toString()).toEqual('10');
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamespacePrice error', async () => {
  const namespace = 'id';

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const errorResponse = responseErrorCV(uintCV(1001));
  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(errorResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { getNamespacePrice } = require('../src');

  const bnsFunctionName = 'get-namespace-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [bufferCVFromString(namespace)],
    network: STACKS_TESTNET,
  };

  await expect(getNamespacePrice({ namespace, network })).rejects.toEqual(new Error('u1001'));
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamePrice', async () => {
  const name = 'test';
  const namespace = 'id';
  const fullyQualifiedName = `${name}.${namespace}`;

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namePriceResponse = responseOkCV(uintCV(10));
  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(namePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { getNamePrice } = require('../src');
  const result = await getNamePrice({ fullyQualifiedName, network });

  const bnsFunctionName = 'get-name-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network: STACKS_TESTNET,
  };

  expect(result.toString()).toEqual('10');
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamePrice error', async () => {
  const name = 'test';
  const namespace = 'id';
  const fullyQualifiedName = `${name}.${namespace}`;

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namePriceResponse = responseErrorCV(uintCV(2001));
  const fetchCallReadOnlyFunction = jest.fn().mockResolvedValue(namePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    fetchCallReadOnlyFunction,
    getAddressFromPrivateKey,
  }));

  const { getNamePrice } = require('../src');

  const bnsFunctionName = 'get-name-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network: STACKS_TESTNET,
  };

  await expect(getNamePrice({ fullyQualifiedName, network })).rejects.toEqual(new Error('u2001'));
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(fetchCallReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('preorderNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';
  const stxToBurn = BigInt(10);

  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  const network = STACKS_TESTNET;

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildPreorderNamespaceTx } = require('../src');
  await buildPreorderNamespaceTx({
    namespace,
    salt,
    stxToBurn,
    publicKey,
    network,
  });

  const bnsFunctionName = 'namespace-preorder';
  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: stxToBurn,
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hash160(utf8ToBytes(`${namespace}${salt}`))), uintCV(stxToBurn)],
    validateWithAbi: false,
    publicKey,
    network,
    postConditions: [burnSTXPostCondition],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('revealNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const priceFunction: PriceFunction = {
    base: BigInt(10),
    coefficient: BigInt(1),
    b1: BigInt(1),
    b2: BigInt(2),
    b3: BigInt(3),
    b4: BigInt(4),
    b5: BigInt(5),
    b6: BigInt(6),
    b7: BigInt(7),
    b8: BigInt(8),
    b9: BigInt(9),
    b10: BigInt(10),
    b11: BigInt(11),
    b12: BigInt(12),
    b13: BigInt(13),
    b14: BigInt(14),
    b15: BigInt(15),
    b16: BigInt(16),
    nonAlphaDiscount: BigInt(0),
    noVowelDiscount: BigInt(0),
  };

  const lifetime = BigInt(10000);
  const namespaceImportAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildRevealNamespaceTx } = require('../src');
  await buildRevealNamespaceTx({
    namespace,
    salt,
    priceFunction,
    lifetime,
    namespaceImportAddress,
    publicKey,
    network,
  });

  const bnsFunctionName = 'namespace-reveal';

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
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
    validateWithAbi: false,
    publicKey,
    network,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('importName', async () => {
  const namespace = 'id';
  const name = 'test';
  const beneficiary = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildImportNameTx } = require('../src');
  await buildImportNameTx({
    namespace,
    name,
    beneficiary,
    zonefile,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-import';

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(beneficiary),
      bufferCV(getZonefileHash(zonefile)),
    ],
    publicKey,
    network,
    validateWithAbi: false,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('readyNamespace', async () => {
  const namespace = 'id';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildReadyNamespaceTx } = require('../src');
  await buildReadyNamespaceTx({
    namespace,
    publicKey,
    network,
  });

  const bnsFunctionName = 'namespace-ready';

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace)],
    publicKey,
    network,
    validateWithAbi: false,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('preorderName', async () => {
  const fullyQualifiedName = 'test.id';
  const salt = 'salt';
  const stxToBurn = BigInt(10);
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildPreorderNameTx } = require('../src');
  await buildPreorderNameTx({
    fullyQualifiedName,
    salt,
    stxToBurn,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-preorder';
  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: stxToBurn,
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(hash160(utf8ToBytes(`${fullyQualifiedName}${salt}`))),
      uintCV(stxToBurn),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    postConditions: [burnSTXPostCondition],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('registerName', async () => {
  const fullyQualifiedName = 'test.id';
  const salt = 'salt';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildRegisterNameTx } = require('../src');
  await buildRegisterNameTx({
    fullyQualifiedName,
    salt,
    zonefile,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-register';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(salt),
      bufferCV(getZonefileHash(zonefile)),
    ],
    publicKey,
    network,
    validateWithAbi: false,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('updateName', async () => {
  const fullyQualifiedName = 'test.id';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildUpdateNameTx } = require('../src');
  await buildUpdateNameTx({
    fullyQualifiedName,
    zonefile,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-update';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCV(getZonefileHash(zonefile)),
    ],
    publicKey,
    network,
    validateWithAbi: false,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('transferName', async () => {
  const fullyQualifiedName = 'test.id';
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
    createNonFungiblePostCondition:
      jest.requireActual('@stacks/transactions').createNonFungiblePostCondition,
  }));

  const { buildTransferNameTx } = require('../src');
  await buildTransferNameTx({
    fullyQualifiedName,
    newOwnerAddress,
    publicKey,
    zonefile,
    network,
  });

  const bnsFunctionName = 'name-transfer';

  const { namespace, name } = decodeFQN(fullyQualifiedName);
  const nameTransferPostConditionOne: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };
  const nameTransferPostConditionTwo: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: newOwnerAddress,
    condition: 'not-sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(newOwnerAddress),
      someCV(bufferCV(getZonefileHash(zonefile))),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    postConditions: [nameTransferPostConditionOne, nameTransferPostConditionTwo],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('transferName optionalArguments', async () => {
  const fullyQualifiedName = 'test.id';
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = undefined;
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
    createNonFungiblePostCondition:
      jest.requireActual('@stacks/transactions').createNonFungiblePostCondition,
  }));

  const { buildTransferNameTx } = require('../src');
  await buildTransferNameTx({
    fullyQualifiedName,
    newOwnerAddress,
    publicKey,
    zonefile,
    network,
  });

  const bnsFunctionName = 'name-transfer';

  const { namespace, name } = decodeFQN(fullyQualifiedName);
  const nameTransferPostConditionOne: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };
  const nameTransferPostConditionTwo: NonFungiblePostCondition = {
    type: 'nft-postcondition',
    address: newOwnerAddress,
    condition: 'not-sent',
    asset: `${network.bootAddress}.bns::names`,
    assetId: tupleCV({
      name: bufferCVFromString(name),
      namespace: bufferCVFromString(namespace),
    }),
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(newOwnerAddress),
      noneCV(),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    postConditions: [nameTransferPostConditionOne, nameTransferPostConditionTwo],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('revokeName', async () => {
  const fullyQualifiedName = 'test.id';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildRevokeNameTx } = require('../src');
  await buildRevokeNameTx({
    fullyQualifiedName,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-revoke';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    publicKey,
    network,
    validateWithAbi: false,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('renewName', async () => {
  const fullyQualifiedName = 'test.id';
  const stxToBurn = BigInt(10);
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildRenewNameTx } = require('../src');
  await buildRenewNameTx({
    fullyQualifiedName,
    stxToBurn,
    newOwnerAddress,
    zonefile,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-renewal';

  const { namespace, name } = decodeFQN(fullyQualifiedName);
  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: stxToBurn,
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      uintCV(stxToBurn),
      someCV(standardPrincipalCV(newOwnerAddress)),
      someCV(bufferCV(getZonefileHash(zonefile))),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    postConditions: [burnSTXPostCondition],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('renewName optionalArguments', async () => {
  const fullyQualifiedName = 'test.id';
  const stxToBurn = BigInt(10);
  const newOwnerAddress = undefined;
  const zonefile = undefined;
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = STACKS_TESTNET;

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeUnsignedContractCall,
  }));

  const { buildRenewNameTx } = require('../src');
  await buildRenewNameTx({
    fullyQualifiedName,
    stxToBurn,
    newOwnerAddress,
    zonefile,
    publicKey,
    network,
  });

  const bnsFunctionName = 'name-renewal';

  const { namespace, name } = decodeFQN(fullyQualifiedName);
  const burnSTXPostCondition: StxPostCondition = {
    type: 'stx-postcondition',
    address: publicKeyToAddress(network.addressVersion.singleSig, publicKey),
    condition: 'eq',
    amount: stxToBurn,
  };
  const expectedBNSContractCallOptions = {
    contractAddress: STACKS_TESTNET.bootAddress,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      uintCV(stxToBurn),
      noneCV(),
      noneCV(),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    postConditions: [burnSTXPostCondition],
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});
