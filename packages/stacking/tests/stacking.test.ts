import { bigIntToBytes, bytesToHex, hexToBytes } from '@stacks/common';
import { base58CheckDecode } from '@stacks/encryption';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  ClarityType,
  ReadOnlyFunctionOptions,
  SignedContractCallOptions,
  TupleCV,
  bufferCV,
  intCV,
  noneCV,
  responseErrorCV,
  responseOkCV,
  someCV,
  standardPrincipalCV,
  trueCV,
  tupleCV,
  uintCV,
  validateContractCall,
} from '@stacks/transactions';
import fetchMock from 'jest-fetch-mock';
import { StackingClient } from '../src';
import { PoXAddressVersion, StackingErrors } from '../src/constants';
import { decodeBtcAddress, poxAddressToBtcAddress } from '../src/utils';
import { V2_POX_REGTEST_POX_3, setApiMocks } from './apiMockingHelpers';

const poxInfo = {
  contract_id: 'ST000000000000000000002AMW42H.pox',
  first_burnchain_block_height: 0,
  min_amount_ustx: 83333940625000,
  prepare_cycle_length: 30,
  rejection_fraction: 3333333333333333,
  reward_cycle_id: 8,
  reward_cycle_length: 120,
  rejection_votes_left_required: 12,
  total_liquid_supply_ustx: 40000291500000000,
};

const balanceInfo = {
  balance: '0x0000000000000000000052c396acadf8',
  locked: '0x0000000000000000000050f1ed629000',
  unlock_height: 3960,
  nonce: 0,
};

const coreInfo = {
  peer_version: 385875968,
  pox_consensus: '926fada0bc9b6a249e297a3f8e18795eb515d635',
  burn_block_height: 1790,
  stable_pox_consensus: '24f2108867fa2fad93e9961140bbfc4c582d56b9',
  stable_burn_block_height: 1789,
  server_version:
    'blockstack-core 0.0.1 => 23.0.0.0 (HEAD:a4deb7a+, release build, linux [x86_64])',
  network_id: 2147483648,
  parent_network_id: 3669344250,
  stacks_tip_height: 1478,
  stacks_tip: '5cec0c6375921031ebcde873280a511e221e1e62df2410cfb48c46b16353d2d3',
  stacks_tip_consensus_hash: '926fada0bc9b6a249e297a3f8e18795eb515d635',
  unanchored_tip: 'd9f92fb58cb598da1d37b2d147b91847e10c1723b4fd9dc545698d68cfdf3f7c',
  exit_at_block_height: null,
};

const rewardsTotalInfo = {
  reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
  reward_amount: '450000',
};

const rewardsInfo = {
  limit: 2,
  offset: 0,
  results: [
    {
      canonical: true,
      burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
      burn_block_height: 2004622,
      burn_amount: '0',
      reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
      reward_amount: '20000',
      reward_index: 0,
    },
    {
      canonical: true,
      burn_block_hash: '0x000000000000002f72213de621f9daf60d76aed3902a811561d06373b2fa6123',
      burn_block_height: 2004621,
      burn_amount: '0',
      reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
      reward_amount: '20000',
      reward_index: 0,
    },
  ],
};

const rewardHoldersInfo = {
  limit: 2,
  offset: 0,
  total: 46,
  results: [
    {
      canonical: true,
      burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
      burn_block_height: 2004622,
      address: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
      slot_index: 1,
    },
    {
      canonical: true,
      burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
      burn_block_height: 2004622,
      address: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
      slot_index: 0,
    },
  ],
};

const blocktimeInfo = {
  testnet: {
    target_block_time: 120,
  },
  mainnet: {
    target_block_time: 600,
  },
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const poxAbi = require('./poxAbi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createContractCallPayload } = require('../../transactions/src/payload.ts'); // not exported currently

// testing helper method
function isPoxAbiValid(opts: SignedContractCallOptions | ReadOnlyFunctionOptions): boolean {
  return validateContractCall(
    createContractCallPayload(
      opts.contractAddress,
      opts.contractName,
      opts.functionName,
      opts.functionArgs
    ),
    poxAbi
  );
}

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

test('check stacking eligibility true', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();

  const functionCallResponse = responseOkCV(trueCV());
  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    callReadOnlyFunction,
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200,
      });
    }
  });

  const cycles = 3;
  const stackingEligibility = await client.canStack({ poxAddress, cycles });

  expect(fetchMock.mock.calls.length).toEqual(2);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(stackingEligibility.eligible).toBe(true);
});

test('check stacking eligibility false bad cycles', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();

  const expectedErrorString = StackingErrors[StackingErrors.ERR_STACKING_INVALID_LOCK_PERIOD];
  const functionCallResponse = responseErrorCV(intCV(2));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    callReadOnlyFunction,
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200,
      });
    }
  });

  const invalidCycles = 150;
  const stackingEligibility = await client.canStack({ poxAddress, cycles: invalidCycles });

  expect(fetchMock.mock.calls.length).toEqual(2);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(stackingEligibility.eligible).toBe(false);
  expect(stackingEligibility.reason).toBe(expectedErrorString);
});

test('stack stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = BigInt(100000000000);
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
  const burnBlockHeight = 2000;

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const stackingResults = await client.stack({
    amountMicroStx,
    poxAddress,
    cycles,
    privateKey,
    burnBlockHeight,
  });

  const { version, hash } = base58CheckDecode(poxAddress);
  const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'stack-stx',
    functionArgs: [
      uintCV(amountMicroStx.toString(10)),
      poxAddressCV,
      uintCV(burnBlockHeight),
      uintCV(cycles),
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(stackingResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('delegate stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = BigInt(100000000000);
  const untilBurnBlockHeight = 2000;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStx({
    amountMicroStx,
    delegateTo,
    untilBurnBlockHeight,
    poxAddress,
    privateKey,
  });

  const { version, hash } = base58CheckDecode(poxAddress);
  const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'delegate-stx',
    functionArgs: [
      uintCV(amountMicroStx.toString(10)),
      standardPrincipalCV(delegateTo),
      someCV(uintCV(untilBurnBlockHeight)),
      someCV(poxAddressCV),
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('delegate stx with empty optional parameters', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const network = new StacksTestnet();
  const amountMicroStx = BigInt(100000000000);
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStx({
    amountMicroStx,
    delegateTo,
    untilBurnBlockHeight: undefined,
    poxAddress: undefined,
    privateKey,
  });

  const noValue = noneCV();

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'delegate-stx',
    functionArgs: [
      uintCV(amountMicroStx.toString(10)),
      standardPrincipalCV(delegateTo),
      noValue,
      noValue,
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('delegate stack stx with one delegator', async () => {
  const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = BigInt(100000000000);
  const burnBlockHeight = 2000;
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200,
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module // needed for jest.mock module
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStackStx({
    stacker,
    amountMicroStx,
    poxAddress,
    burnBlockHeight,
    cycles,
    privateKey,
  });

  const { version, hash } = base58CheckDecode(poxAddress);
  const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'delegate-stack-stx',
    functionArgs: [
      standardPrincipalCV(stacker),
      uintCV(amountMicroStx.toString(10)),
      poxAddressCV,
      uintCV(burnBlockHeight),
      uintCV(cycles),
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('delegate stack stx with set nonce', async () => {
  const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = BigInt(100000000000);
  const burnBlockHeight = 2000;
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
  const nonce = BigInt(1);

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200,
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStackStx({
    stacker,
    amountMicroStx,
    poxAddress,
    burnBlockHeight,
    cycles,
    privateKey,
    nonce,
  });

  const { version, hash } = base58CheckDecode(poxAddress);
  const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'delegate-stack-stx',
    functionArgs: [
      standardPrincipalCV(stacker),
      uintCV(amountMicroStx.toString(10)),
      poxAddressCV,
      uintCV(burnBlockHeight),
      uintCV(cycles),
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    nonce,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('delegator commit', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const rewardCycle = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const delegateResults = await client.stackAggregationCommit({
    poxAddress,
    rewardCycle,
    privateKey,
  });

  const { version, hash } = base58CheckDecode(poxAddress);
  const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'stack-aggregation-commit',
    functionArgs: [poxAddressCV, uintCV(rewardCycle)],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('revoke delegate stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' };
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    makeContractCall,
    broadcastTransaction,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const revokeDelegateResults = await client.revokeDelegateStx(privateKey);

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'revoke-delegate-stx',
    functionArgs: [],
    validateWithAbi: true,
    network,
    senderKey: privateKey,
    anchorMode: AnchorMode.Any,
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(revokeDelegateResults).toEqual(broadcastResponse);
  expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
});

test('get stacking status', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();
  const amountMicrostx = 10_000;
  const firstRewardCycle = 10;
  const lockPeriod = 20;
  const version = '00';
  const hashbytes = '05cf52a44bf3e6829b4f8c221cc675355bf83b7d';

  const functionCallResponse = someCV(
    tupleCV({
      'amount-ustx': uintCV(amountMicrostx),
      'first-reward-cycle': uintCV(firstRewardCycle),
      'lock-period': uintCV(lockPeriod),
      'pox-addr': tupleCV({
        version: bufferCV(hexToBytes(version)),
        hashbytes: bufferCV(hexToBytes(hashbytes)),
      }),
    })
  );

  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    ...jest.requireActual('@stacks/transactions'),
    callReadOnlyFunction,
  }));

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200,
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const stackingStatus = await client.getStatus();

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'get-stacker-info',
    functionArgs: [standardPrincipalCV(address)],
    senderAddress: address,
    network,
  };

  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);

  expect(stackingStatus.stacked).toEqual(true);
  expect(stackingStatus.details.first_reward_cycle).toEqual(firstRewardCycle);
  expect(stackingStatus.details.lock_period).toEqual(lockPeriod);
  expect(bytesToHex(stackingStatus.details.pox_address.version)).toEqual(version);
  expect(bytesToHex(stackingStatus.details.pox_address.hashbytes)).toEqual(hashbytes);
  expect(isPoxAbiValid(expectedReadOnlyFunctionCallOptions)).toBe(true);
});

test('get core info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(coreInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const responseCoreInfo = await client.getCoreInfo();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getInfoUrl());
  expect(responseCoreInfo).toEqual(coreInfo);
});

test('get pox info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const responsePoxInfo = await client.getPoxInfo();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(responsePoxInfo).toEqual(poxInfo);
});

test('get a list of burnchain rewards for the set address', async () => {
  const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(rewardsInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);
  const options = { limit: 2, offset: 0 };
  const response = await client.getRewardsForBtcAddress(options);

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardsUrl(address, options));
  expect(response).toEqual(rewardsInfo);
});

test('get the burnchain rewards total for the set address', async () => {
  const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(rewardsTotalInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);
  const response = await client.getRewardsTotalForBtcAddress();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardsTotalUrl(address));
  expect(response).toEqual(rewardsTotalInfo);
});

test('get a list of burnchain reward holders for the set address ', async () => {
  const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(rewardHoldersInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);
  const options = { limit: 2, offset: 0 };
  const response = await client.getRewardHoldersForBtcAddress(options);

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardHoldersUrl(address, options));
  expect(response).toEqual(rewardHoldersInfo);
});

test('get target block time info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(blocktimeInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const responseBlockTimeInfo = await client.getTargetBlockTime();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getBlockTimeInfoUrl());
  expect(responseBlockTimeInfo).toEqual(blocktimeInfo.testnet.target_block_time);
});

test('get account balance', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(balanceInfo),
      status: 200,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const responseBalanceInfo = await client.getAccountBalance();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(responseBalanceInfo.toString()).toEqual(BigInt(balanceInfo.balance).toString());
});

test('get seconds until next cycle', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock
    .mockResponseOnce(() => {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200,
      });
    })
    .mockResponseOnce(() => {
      return Promise.resolve({
        body: JSON.stringify(blocktimeInfo),
        status: 200,
      });
    })
    .mockResponseOnce(() => {
      return Promise.resolve({
        body: JSON.stringify(coreInfo),
        status: 200,
      });
    });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(address, network);

  const responseSecondsUntilNextCycle = await client.getSecondsUntilNextCycle();
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getBlockTimeInfoUrl());
  expect(fetchMock.mock.calls[2][0]).toEqual(network.getInfoUrl());

  // next reward cycle in 10 blocks
  expect(responseSecondsUntilNextCycle.toString()).toEqual((10 * 120).toString());
});

test('pox address hash mode', () => {
  const p2pkh = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const p2pkhTestnet = 'n4RKBLKb6n9v68yMRUYm6xRCx2YkkxpSQm';
  const p2sh = '3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX';
  const p2shTestnet = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';

  const p2pkhAddrVersion = decodeBtcAddress(p2pkh).version;
  const p2pkhTestnetAddrVersion = decodeBtcAddress(p2pkhTestnet).version;
  const p2shAddrVersion = decodeBtcAddress(p2sh).version;
  const p2shTestnetAddrVersion = decodeBtcAddress(p2shTestnet).version;

  expect(p2pkhAddrVersion).toEqual(PoXAddressVersion.P2PKH);
  expect(p2pkhTestnetAddrVersion).toEqual(PoXAddressVersion.P2PKH);
  expect(p2shAddrVersion).toEqual(PoXAddressVersion.P2SH);
  expect(p2shTestnetAddrVersion).toEqual(PoXAddressVersion.P2SH);

  const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
  const p2wpkhTestnet = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
  const p2wsh = 'bc1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4sqsth99';
  const p2wshTestnet = 'tb1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4shcacl2';

  const p2wpkhAddrVersion = decodeBtcAddress(p2wpkh).version;
  const p2wpkhTestnetAddrVersion = decodeBtcAddress(p2wpkhTestnet).version;
  const p2wshAddrVersion = decodeBtcAddress(p2wsh).version;
  const p2wshTestnetAddrVersion = decodeBtcAddress(p2wshTestnet).version;

  expect(p2wpkhAddrVersion).toBe(PoXAddressVersion.P2WPKH);
  expect(p2wpkhTestnetAddrVersion).toBe(PoXAddressVersion.P2WPKH);
  expect(p2wshAddrVersion).toBe(PoXAddressVersion.P2WSH);
  expect(p2wshTestnetAddrVersion).toBe(PoXAddressVersion.P2WSH);
});

test('pox address to btc address', () => {
  const vectors: {
    version: number;
    hashBytes: Uint8Array;
    network: 'mainnet' | 'testnet';
    expectedBtcAddr: string;
  }[] = [
    {
      version: 0x01,
      hashBytes: hexToBytes('07366658d1e5f0f75c585a17b618b776f4f10a6b'),
      network: 'mainnet',
      expectedBtcAddr: '32M9pegJxqXBoxXSKBN1s7HJUR2YMkMaFg',
    },
    {
      version: 0x01,
      hashBytes: hexToBytes('9b24b88b1334b0a17a99c09470c4df06ffd3ea22'),
      network: 'mainnet',
      expectedBtcAddr: '3FqLegt1Lo1JuhiBAQQiM5WwDdmefTo5zd',
    },
    {
      version: 0x00,
      hashBytes: hexToBytes('fde9c82d7bc43f55e9054438470c3ca8d6e7237f'),
      network: 'mainnet',
      expectedBtcAddr: '1Q9a1zGPfJ4oH5Xaz5wc7BdvWV21fSNkkr',
    },
    {
      version: 0x00,
      hashBytes: hexToBytes('5dc795522f81dcb7eb774a0b8e84b612e3edc141'),
      network: 'testnet',
      expectedBtcAddr: 'mp4pEBdJiMh6aL5Uhs6nZX1XhyZ4V2xrzg',
    },
    {
      version: 0x01,
      hashBytes: hexToBytes('3149c3eba2d21cfdeea56894866b8f4cd11b72ad'),
      network: 'testnet',
      expectedBtcAddr: '2MwjqTzEJodSaoehcxRSqfWrvJMGZHq4tdC',
    },
  ];

  vectors.forEach(item => {
    const btcAddress = poxAddressToBtcAddress(item.version, item.hashBytes, item.network);
    expect(btcAddress).toBe(item.expectedBtcAddr);
    const decodedAddress = decodeBtcAddress(btcAddress);
    expect(decodedAddress.version).toBe(item.version);
    expect(bytesToHex(decodedAddress.data)).toBe(bytesToHex(item.hashBytes));
  });

  vectors.forEach(item => {
    const clarityValue: TupleCV = {
      type: ClarityType.Tuple,
      data: {
        version: {
          type: ClarityType.Buffer,
          buffer: new Uint8Array([item.version]),
        },
        hashbytes: {
          type: ClarityType.Buffer,
          buffer: item.hashBytes,
        },
      },
    };
    const btcAddress = poxAddressToBtcAddress(clarityValue, item.network);
    expect(btcAddress).toBe(item.expectedBtcAddr);
    const decodedAddress = decodeBtcAddress(btcAddress);
    expect(decodedAddress.version).toBe(item.version);
    expect(bytesToHex(decodedAddress.data)).toBe(bytesToHex(item.hashBytes));
  });
});

test('client operations with contract principal stacker', () => {
  fetchMock.mockOnce(V2_POX_REGTEST_POX_3);
  fetchMock.mockOnce(
    `{"balance":"0x0000000000000000000000001e22f616","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`
  );
  fetchMock.mockOnce(`{"okay":true,"result":"0x09"}`);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StackingClient } = require('../src'); // needed for jest.mock module
  const client = new StackingClient(
    'SP2HNY1HNF5X25VC7GZ3Y48JC4762AYFHKS061BM0.stacking-contract',
    new StacksTestnet()
  );
  expect(async () => await client.getStatus()).not.toThrow();
});

test('getSecondsUntilStackingDeadline', async () => {
  const network = new StacksMainnet({ url: 'http://localhost:3999' });
  const client = new StackingClient('', network);

  setApiMocks({
    '/extended/v1/info/network_block_times': `{"testnet":{"target_block_time":120},"mainnet":{"target_block_time":600}}`,
    '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600058115845055,"first_burnchain_block_height":0,"current_burnchain_block_height":275,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005811584505576,"current_cycle":{"id":54,"min_threshold_ustx":1875190000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":55,"min_threshold_ustx":1875190000000000,"min_increment_ustx":7500726448063,"stacked_ustx":0,"prepare_phase_start_block_height":279,"blocks_until_prepare_phase":4,"reward_phase_start_block_height":280,"blocks_until_reward_phase":5,"ustx_until_pox_rejection":14656114351294034000},"min_amount_ustx":1875190000000000,"prepare_cycle_length":1,"reward_cycle_id":54,"reward_cycle_length":5,"rejection_votes_left_required":14656114351294034000,"next_reward_cycle_in":5,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
  });

  let seconds = await client.getSecondsUntilStackingDeadline();
  expect(seconds).toBe(4 * 10 * 60); // four blocks until prepare phase

  setApiMocks({
    '/extended/v1/info/network_block_times': `{"testnet":{"target_block_time":120},"mainnet":{"target_block_time":600}}`,
    '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600058812952055,"first_burnchain_block_height":0,"current_burnchain_block_height":344,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005881295205576,"current_cycle":{"id":68,"min_threshold_ustx":1875190000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":69,"min_threshold_ustx":1875190000000000,"min_increment_ustx":7500735161900,"stacked_ustx":0,"prepare_phase_start_block_height":344,"blocks_until_prepare_phase":0,"reward_phase_start_block_height":345,"blocks_until_reward_phase":1,"ustx_until_pox_rejection":5198637306263702000},"min_amount_ustx":1875190000000000,"prepare_cycle_length":1,"reward_cycle_id":68,"reward_cycle_length":5,"rejection_votes_left_required":5198637306263702000,"next_reward_cycle_in":1,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
  });

  seconds = await client.getSecondsUntilStackingDeadline();
  expect(seconds).toBe(0); // this time we are in the prepare phase

  // warning: manually changed response to negative value
  setApiMocks({
    '/extended/v1/info/network_block_times': `{"testnet":{"target_block_time":120},"mainnet":{"target_block_time":600}}`,
    '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600058812952055,"first_burnchain_block_height":0,"current_burnchain_block_height":344,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005881295205576,"current_cycle":{"id":68,"min_threshold_ustx":1875190000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":69,"min_threshold_ustx":1875190000000000,"min_increment_ustx":7500735161900,"stacked_ustx":0,"prepare_phase_start_block_height":344,"blocks_until_prepare_phase":-50,"reward_phase_start_block_height":345,"blocks_until_reward_phase":1,"ustx_until_pox_rejection":5198637306263702000},"min_amount_ustx":1875190000000000,"prepare_cycle_length":1,"reward_cycle_id":68,"reward_cycle_length":5,"rejection_votes_left_required":5198637306263702000,"next_reward_cycle_in":1,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
  });

  seconds = await client.getSecondsUntilStackingDeadline();
  expect(seconds).toBeLessThan(0); // negative (deadline passed)
  expect(seconds).toBe(-50 * 10 * 60); // this time we are in the prepare phase
});
