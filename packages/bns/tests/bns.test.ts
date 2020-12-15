// import { StacksTestnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';

import { 
  responseOkCV,
  responseErrorCV,
  trueCV,
  falseCV,
  // uintCV, 
  bufferCV, 
  // tupleCV, 
  // standardPrincipalCV, 
  // someCV,
  // AddressHashMode
} from '@stacks/transactions';

import {
  StacksMainnet
} from '@stacks/network';

import {
  BNS_CONTRACT_ADDRESS,
  BNS_CONTRACT_NAME
} from '../src'

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
