import fetchMock from 'jest-fetch-mock';

import {
  responseOkCV,
  responseErrorCV,
  trueCV,
  falseCV,
  uintCV,
  bufferCV,
  hash160,
  standardPrincipalCV,
  AnchorMode,
} from '@stacks/transactions';

import {
  StacksTestnet
} from '@stacks/network';

import {
  BNS_CONTRACT_NAME, BnsContractAddress, PriceFunction
} from '../src'

import {bufferCVFromString, decodeFQN, getZonefileHash, uintCVFromBN} from "../src/utils";

import BN from "bn.js";

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

test('canRegisterName true', async () => {
  const fullyQualifiedName = 'test.id';

  const trueFunctionCallResponse = responseOkCV(trueCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(trueFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network });

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[1])),
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network
  };

  expect(result).toEqual(true);  
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName false', async () => {
  const fullyQualifiedName = 'test.id';

  const falseFunctionCallResponse = responseOkCV(falseCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(falseFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network} );

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[1])),
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network
  };

  expect(result).toEqual(false);  
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName error', async () => {
  const fullyQualifiedName = 'test.id';

  const errorFunctionCallResponse = responseErrorCV(bufferCV(Buffer.from('error')));
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(errorFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV
  }));

  const { canRegisterName } = require('../src');
  const result = await canRegisterName({ fullyQualifiedName, network });

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[1])),
      bufferCV(Buffer.from(fullyQualifiedName.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network
  };

  expect(result).toEqual(false);  
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamespacePrice', async () => {
  const namespace = 'id';

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namespacePriceResponse = responseOkCV(uintCV(10));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(namespacePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV
  }));

  const { getNamespacePrice } = require('../src');
  const result = await getNamespacePrice({ namespace, network });

  const bnsFunctionName = 'get-namespace-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
      senderAddress: address,
      functionArgs: [
      bufferCVFromString(namespace)
    ],
      network
  };

  expect(result).toEqual(new BN(10));
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamespacePrice error', async () => {
  const namespace = 'id';

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const errorResponse = responseErrorCV(uintCV(1001));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(errorResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    cvToString: jest.requireActual('@stacks/transactions').cvToString
  }));

  const { getNamespacePrice } = require('../src');

  const bnsFunctionName = 'get-namespace-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace)
    ],
    network
  };

  await expect(getNamespacePrice({ namespace, network })).rejects.toEqual(new Error('u1001'));
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamePrice', async () => {
  const name = 'test';
  const namespace = 'id';
  const fullyQualifiedName = `${name}.${namespace}`;

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namePriceResponse = responseOkCV(uintCV(10));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(namePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV
  }));

  const { getNamePrice } = require('../src');
  const result = await getNamePrice({ fullyQualifiedName, network });

  const bnsFunctionName = 'get-name-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name)
    ],
    network
  };

  expect(result).toEqual(new BN(10));
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('getNamePrice error', async () => {
  const name = 'test';
  const namespace = 'id';
  const fullyQualifiedName = `${name}.${namespace}`;

  const address = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const namePriceResponse = responseErrorCV(uintCV(2001));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(namePriceResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(address);

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    getAddressFromPrivateKey,
    privateKeyToString: jest.requireActual('@stacks/transactions').privateKeyToString,
    makeRandomPrivKey: jest.requireActual('@stacks/transactions').makeRandomPrivKey,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    ClarityValue: jest.requireActual('@stacks/transactions').ClarityValue,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    cvToString: jest.requireActual('@stacks/transactions').cvToString,
  }));

  const { getNamePrice } = require('../src');

  const bnsFunctionName = 'get-name-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name)
    ],
    network
  };

  await expect(getNamePrice({ fullyQualifiedName, network })).rejects.toEqual(new Error('u2001'));
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('preorderNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';
  const stxToBurn = new BN(10);

  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  const network = new StacksTestnet();

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildPreorderNamespaceTx } = require('../src');
  await buildPreorderNamespaceTx({
    namespace,
    salt,
    stxToBurn,
    publicKey,
    network
  });

  const bnsFunctionName = 'namespace-preorder';

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(hash160(Buffer.from(`${namespace}${salt}`))),
      uintCVFromBN(stxToBurn)
    ],
    validateWithAbi: false,
    publicKey,
    network,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('revealNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const priceFunction: PriceFunction = {
    base: new BN(10),
    coefficient: new BN(1),
    b1: new BN(1),
    b2: new BN(2),
    b3: new BN(3),
    b4: new BN(4),
    b5: new BN(5),
    b6: new BN(6),
    b7: new BN(7),
    b8: new BN(8),
    b9: new BN(9),
    b10: new BN(10),
    b11: new BN(11),
    b12: new BN(12),
    b13: new BN(13),
    b14: new BN(14),
    b15: new BN(15),
    b16: new BN(16),
    nonAlphaDiscount: new BN(0),
    noVowelDiscount: new BN(0),
  }

  const lifetime = new BN(10000);
  const namespaceImportAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildRevealNamespaceTx } = require('../src');
  await buildRevealNamespaceTx({
    namespace,
    salt,
    priceFunction,
    lifetime,
    namespaceImportAddress,
    publicKey,
    network
  });

  const bnsFunctionName = 'namespace-reveal';

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(salt),
      uintCVFromBN(priceFunction.base),
      uintCVFromBN(priceFunction.coefficient),
      uintCVFromBN(priceFunction.b1),
      uintCVFromBN(priceFunction.b2),
      uintCVFromBN(priceFunction.b3),
      uintCVFromBN(priceFunction.b4),
      uintCVFromBN(priceFunction.b5),
      uintCVFromBN(priceFunction.b6),
      uintCVFromBN(priceFunction.b7),
      uintCVFromBN(priceFunction.b8),
      uintCVFromBN(priceFunction.b9),
      uintCVFromBN(priceFunction.b10),
      uintCVFromBN(priceFunction.b11),
      uintCVFromBN(priceFunction.b12),
      uintCVFromBN(priceFunction.b13),
      uintCVFromBN(priceFunction.b14),
      uintCVFromBN(priceFunction.b15),
      uintCVFromBN(priceFunction.b16),
      uintCVFromBN(priceFunction.nonAlphaDiscount),
      uintCVFromBN(priceFunction.noVowelDiscount),
      uintCVFromBN(lifetime),
      standardPrincipalCV(namespaceImportAddress),
    ],
    validateWithAbi: false,
    publicKey,
    network,
    anchorMode: AnchorMode.Any,
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

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildImportNameTx } = require('../src');
  await buildImportNameTx({
    namespace,
    name,
    beneficiary,
    zonefile,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-import';

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(beneficiary),
      bufferCV(getZonefileHash(zonefile))
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('readyNamespace', async () => {
  const namespace = 'id';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildReadyNamespaceTx } = require('../src');
  await buildReadyNamespaceTx({
    namespace,
    publicKey,
    network
  });

  const bnsFunctionName = 'namespace-ready';

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('preorderName', async () => {
  const fullyQualifiedName = 'test.id';
  const salt = 'salt';
  const stxToBurn = new BN(10);
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildPreorderNameTx } = require('../src');
  await buildPreorderNameTx({
    fullyQualifiedName,
    salt,
    stxToBurn,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-preorder';

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(hash160(Buffer.from(`${fullyQualifiedName}${salt}`))),
      uintCVFromBN(stxToBurn),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
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

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildRegisterNameTx } = require('../src');
  await buildRegisterNameTx({
    fullyQualifiedName,
    salt,
    zonefile,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-register';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(salt),
      bufferCV(getZonefileHash(zonefile))
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('updateName', async () => {
  const fullyQualifiedName = 'test.id';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildUpdateNameTx } = require('../src');
  await buildUpdateNameTx({
    fullyQualifiedName,
    zonefile,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-update';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCV(getZonefileHash(zonefile))
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
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

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildTransferNameTx } = require('../src');
  await buildTransferNameTx({
    fullyQualifiedName,
    newOwnerAddress,
    publicKey,
    zonefile,
    network
  });

  const bnsFunctionName = 'name-transfer';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(newOwnerAddress),
      bufferCV(getZonefileHash(zonefile)),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('revokeName', async () => {
  const fullyQualifiedName = 'test.id';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildRevokeNameTx } = require('../src');
  await buildRevokeNameTx({
    fullyQualifiedName,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-revoke';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('renewName', async () => {
  const fullyQualifiedName = 'test.id';
  const stxToBurn = new BN(10);
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const publicKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const makeUnsignedContractCall = jest.fn().mockResolvedValue({});

  const network = new StacksTestnet();

  jest.mock('@stacks/transactions', () => ({
    makeUnsignedContractCall,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
    AnchorMode: jest.requireActual('@stacks/transactions').AnchorMode,
  }));

  const { buildRenewNameTx } = require('../src');
  await buildRenewNameTx({
    fullyQualifiedName,
    stxToBurn,
    newOwnerAddress,
    zonefile,
    publicKey,
    network
  });

  const bnsFunctionName = 'name-renewal';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BnsContractAddress.testnet,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      uintCVFromBN(stxToBurn),
      bufferCVFromString(newOwnerAddress),
      bufferCV(getZonefileHash(zonefile))
    ],
    publicKey,
    network,
    validateWithAbi: false,
    anchorMode: AnchorMode.Any,
  };

  expect(makeUnsignedContractCall).toHaveBeenCalledTimes(1);
  expect(makeUnsignedContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});
