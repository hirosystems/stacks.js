import fetchMock from 'jest-fetch-mock';

import {
  responseOkCV,
  responseErrorCV,
  trueCV,
  falseCV,
  uintCV,
  bufferCV,
  makeRandomPrivKey,
  hash160,
  privateKeyToString, standardPrincipalCV,
} from '@stacks/transactions';

import {
  StacksMainnet
} from '@stacks/network';

import {
  BNS_CONTRACT_ADDRESS,
  BNS_CONTRACT_NAME, PriceFunction
} from '../src'

import {bufferCVFromString, decodeFQN, getZonefileHash, uintCVFromBN} from "../src/utils";

import BN from "bn.js";

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

test('canRegisterName true', async () => {
  const fqdn = 'test.id';

  const trueFunctionCallResponse = responseOkCV(trueCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(trueFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksMainnet();

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
  const result = await canRegisterName(fqdn, network);

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fqdn.split('.')[1])),
      bufferCV(Buffer.from(fqdn.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network
  };

  expect(result).toEqual(true);  
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName false', async () => {
  const fqdn = 'test.id';

  const falseFunctionCallResponse = responseOkCV(falseCV());
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(falseFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksMainnet();

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
  const result = await canRegisterName(fqdn, network);

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fqdn.split('.')[1])),
      bufferCV(Buffer.from(fqdn.split('.')[0])),
    ],
    senderAddress: notRandomAddress,
    network
  };

  expect(result).toEqual(false);  
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('canRegisterName error', async () => {
  const fqdn = 'test.id';

  const errorFunctionCallResponse = responseErrorCV(bufferCV(Buffer.from('error')));
  const notRandomAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';

  const callReadOnlyFunction = jest.fn().mockResolvedValue(errorFunctionCallResponse);
  const getAddressFromPrivateKey = jest.fn().mockReturnValue(notRandomAddress);

  const network = new StacksMainnet();

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
  const result = await canRegisterName(fqdn, network);

  const bnsFunctionName = 'can-name-be-registered';
  
  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(Buffer.from(fqdn.split('.')[1])),
      bufferCV(Buffer.from(fqdn.split('.')[0])),
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

  const network = new StacksMainnet();

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
  const result = await getNamespacePrice(namespace, network);

  const bnsFunctionName = 'get-namespace-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
      senderAddress: address,
      functionArgs: [
      bufferCVFromString(namespace)
    ],
      network: network
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

  const network = new StacksMainnet();

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
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace)
    ],
    network: network
  };

  await expect(getNamespacePrice(namespace, network)).rejects.toEqual(new Error('u1001'));
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

  const network = new StacksMainnet();

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
  const result = await getNamePrice(fullyQualifiedName, network);

  const bnsFunctionName = 'get-name-price';

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name)
    ],
    network: network
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

  const network = new StacksMainnet();

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
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    senderAddress: address,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name)
    ],
    network: network
  };

  await expect(getNamePrice(fullyQualifiedName, network)).rejects.toEqual(new Error('u2001'));
  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
});

test('preorderNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';
  const stxToBurn = new BN(10);

  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160
  }));

  const { preorderNamespace } = require('../src');
  const result = await preorderNamespace({
    namespace,
    salt,
    stxToBurn,
    privateKey,
    network
  });

  const bnsFunctionName = 'namespace-preorder';

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(hash160(Buffer.from(`0x${namespace}${salt}`))),
      uintCVFromBN(stxToBurn)
    ],
    validateWithAbi: true,
    senderKey: privateKey,
    network: network
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('revealNamespace', async () => {
  const namespace = 'id';
  const salt = 'salt';

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
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    hash160: jest.requireActual('@stacks/transactions').hash160
  }));

  const { revealNamespace } = require('../src');
  const result = await revealNamespace({
    namespace,
    salt,
    priceFunction,
    lifetime,
    namespaceImportAddress,
    privateKey,
    network
  });

  const bnsFunctionName = 'namespace-reveal';

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
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
    validateWithAbi: true,
    senderKey: privateKey,
    network: network
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('importName', async () => {
  const namespace = 'id';
  const name = 'test';
  const beneficiary = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';

  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    hash160: jest.requireActual('@stacks/transactions').hash160
  }));

  const { importName } = require('../src');
  const result = await importName({
    namespace,
    name,
    beneficiary,
    zonefile,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-import';

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      standardPrincipalCV(beneficiary),
      bufferCV(getZonefileHash(zonefile))
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledWith(expect.anything(), network, Buffer.from(zonefile));
});

test('readyNamespace', async () => {
  const namespace = 'id';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
  }));

  const { readyNamespace } = require('../src');
  const result = await readyNamespace({
    namespace,
    privateKey,
    network
  });

  const bnsFunctionName = 'namespace-ready';

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('preorderName', async () => {
  const fullyQualifiedName = 'test.id';
  const salt = 'salt';
  const stxToBurn = new BN(10);
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { preorderName } = require('../src');
  const result = await preorderName({
    fullyQualifiedName,
    salt,
    stxToBurn,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-preorder';

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCV(hash160(Buffer.from(`0x${fullyQualifiedName}${salt}`))),
      uintCVFromBN(stxToBurn),
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('registerName', async () => {
  const fullyQualifiedName = 'test.id';
  const salt = 'salt';
  const zonefile = 'zonefile';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { registerName } = require('../src');
  const result = await registerName({
    fullyQualifiedName,
    salt,
    zonefile,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-register';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(salt),
      bufferCV(getZonefileHash(zonefile))
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledWith(expect.anything(), network, Buffer.from(zonefile));
});

test('updateName', async () => {
  const fullyQualifiedName = 'test.id';
  const zonefile = 'zonefile';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { updateName } = require('../src');
  const result = await updateName({
    fullyQualifiedName,
    zonefile,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-update';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCV(getZonefileHash(zonefile))
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledWith(expect.anything(), network, Buffer.from(zonefile));
});

test('transferName', async () => {
  const fullyQualifiedName = 'test.id';
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { transferName } = require('../src');
  const result = await transferName({
    fullyQualifiedName,
    newOwnerAddress,
    privateKey,
    zonefile,
    network
  });

  const bnsFunctionName = 'name-transfer';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(newOwnerAddress),
      bufferCV(getZonefileHash(zonefile)),
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledWith(expect.anything(), network, Buffer.from(zonefile));
});

test('revokeName', async () => {
  const fullyQualifiedName = 'test.id';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { revokeName } = require('../src');
  const result = await revokeName({
    fullyQualifiedName,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-revoke';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
});

test('renewName', async () => {
  const fullyQualifiedName = 'test.id';
  const stxToBurn = new BN(10);
  const newOwnerAddress = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE';
  const zonefile = 'zonefile';
  const privateKey = privateKeyToString(makeRandomPrivKey());

  const makeContractCall = jest.fn().mockResolvedValue('tx');
  const broadcastTransaction = jest.fn().mockResolvedValue('0');

  const network = new StacksMainnet();

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    hash160: jest.requireActual('@stacks/transactions').hash160,
  }));

  const { renewName } = require('../src');
  const result = await renewName({
    fullyQualifiedName,
    stxToBurn,
    newOwnerAddress,
    zonefile,
    privateKey,
    network
  });

  const bnsFunctionName = 'name-renewal';

  const { namespace, name } = decodeFQN(fullyQualifiedName);

  const expectedBNSContractCallOptions = {
    contractAddress: BNS_CONTRACT_ADDRESS,
    contractName: BNS_CONTRACT_NAME,
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      uintCVFromBN(stxToBurn),
      bufferCVFromString(newOwnerAddress),
      bufferCV(getZonefileHash(zonefile))
    ],
    senderKey: privateKey,
    network: network,
    validateWithAbi: true,
  };

  expect(result).toEqual({
    success: true,
    data: {
      txid: '0'
    }
  });
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedBNSContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledWith(expect.anything(), network, Buffer.from(zonefile));
});
