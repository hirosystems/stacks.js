import { StacksTestnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';
import BN from 'bn.js';
import { StackingErrors } from '../src/constants';
import {
  uintCV,
  bufferCV,
  tupleCV,
  standardPrincipalCV,
  someCV,
  AddressHashMode,
  noneCV,
  responseOkCV,
  trueCV,
  responseErrorCV,
  intCV,
} from '@stacks/transactions';
import { address as btcAddress } from 'bitcoinjs-lib';
import { decodeBtcAddress, getAddressHashMode, InvalidAddressError } from '../src/utils';

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

const poxInfo = {
  contract_id: 'ST000000000000000000002AMW42H.pox',
  first_burnchain_block_height: 0,
  min_amount_ustx: 83333940625000,
  prepare_cycle_length: 30,
  rejection_fraction: 3333333333333333,
  reward_cycle_id: 8,
  reward_cycle_length: 120,
  rejection_votes_left_required: 12,
  total_liquid_supply_ustx: 40000291500000000
};

const balanceInfo = {
  balance: "0x0000000000000000000052c396acadf8",
  locked: "0x0000000000000000000050f1ed629000",
  unlock_height: 3960,
  nonce: 0
}

const coreInfo = {
  "peer_version": 385875968,
  "pox_consensus": "926fada0bc9b6a249e297a3f8e18795eb515d635",
  "burn_block_height": 1790,
  "stable_pox_consensus": "24f2108867fa2fad93e9961140bbfc4c582d56b9",
  "stable_burn_block_height": 1789,
  "server_version": "blockstack-core 0.0.1 => 23.0.0.0 (HEAD:a4deb7a+, release build, linux [x86_64])",
  "network_id": 2147483648,
  "parent_network_id": 3669344250,
  "stacks_tip_height": 1478,
  "stacks_tip": "5cec0c6375921031ebcde873280a511e221e1e62df2410cfb48c46b16353d2d3",
  "stacks_tip_consensus_hash": "926fada0bc9b6a249e297a3f8e18795eb515d635",
  "unanchored_tip": "d9f92fb58cb598da1d37b2d147b91847e10c1723b4fd9dc545698d68cfdf3f7c",
  "exit_at_block_height": null
}

const blocktimeInfo = {
  testnet: {
    target_block_time: 120
  },
  mainnet: {
    target_block_time: 600
  }
}

test('check stacking eligibility true', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();

  const functionCallResponse = responseOkCV(trueCV());
  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    trueCV: jest.requireActual('@stacks/transactions').trueCV,
    responseOkCV: jest.requireActual('@stacks/transactions').responseOkCV,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }))

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200
      })
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200
      })
    }
  })

  const cycles = 3;
  const stackingEligibility = await client.canStack({ poxAddress, cycles });

  expect(fetchMock.mock.calls.length).toEqual(2);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(stackingEligibility.eligible).toBe(true);
})

test('check stacking eligibility false bad cycles', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();

  const expectedErrorString = StackingErrors[StackingErrors.ERR_STACKING_INVALID_LOCK_PERIOD];
  const functionCallResponse = responseErrorCV(intCV(2));
  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    intCV: jest.requireActual('@stacks/transactions').intCV,
    responseErrorCV: jest.requireActual('@stacks/transactions').responseErrorCV,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    cvToString: jest.requireActual('@stacks/transactions').cvToString,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }))

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200
      })
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200
      })
    }
  })

  const invalidCycles = 150;
  const stackingEligibility = await client.canStack({ poxAddress, cycles: invalidCycles });

  expect(fetchMock.mock.calls.length).toEqual(2);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(stackingEligibility.eligible).toBe(false);
  expect(stackingEligibility.reason).toBe(expectedErrorString);
})

test('stack stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = new BN(100000000000);
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
  const burnBlockHeight = 2000;

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }))

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const stackingResults = await client.stack({
    amountMicroStx,
    poxAddress,
    cycles,
    privateKey,
    burnBlockHeight
  });

  const { version, hash } = btcAddress.fromBase58Check(poxAddress);
  const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
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
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(stackingResults).toEqual(broadcastResponse);
})

test('delegate stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = new BN(100000000000);
  const untilBurnBlockHeight = 2000;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    someCV: jest.requireActual('@stacks/transactions').someCV,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStx({
    amountMicroStx,
    delegateTo,
    untilBurnBlockHeight,
    poxAddress,
    privateKey,
  });

  const { version, hash } = btcAddress.fromBase58Check(poxAddress);
  const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
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
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
})

test('delegate stx with empty optional parameters', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const network = new StacksTestnet();
  const amountMicroStx = new BN(100000000000);
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    noneCV: jest.requireActual('@stacks/transactions').noneCV,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
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
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
})

test('delegate stack stx with one delegator', async () => {
  const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = new BN(100000000000);
  const burnBlockHeight = 2000;
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    getNonce: jest.requireActual('@stacks/transactions').getNonce,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    getAddressFromPrivateKey: jest.requireActual('@stacks/transactions').getAddressFromPrivateKey,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200
      })
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200
      })
    }
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const delegateResults = await client.delegateStackStx({
    stacker,
    amountMicroStx,
    poxAddress,
    burnBlockHeight,
    cycles,
    privateKey,
  });

  const { version, hash } = btcAddress.fromBase58Check(poxAddress);
  const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
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
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
})

test('delegate stack stx with set nonce', async () => {
  const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const amountMicroStx = new BN(100000000000);
  const burnBlockHeight = 2000;
  const cycles = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
  const nonce = new BN(1);

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    getNonce: jest.requireActual('@stacks/transactions').getNonce,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    getAddressFromPrivateKey: jest.requireActual('@stacks/transactions').getAddressFromPrivateKey,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200
      })
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200
      })
    }
  })

  const { StackingClient } = require('../src');
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

  const { version, hash } = btcAddress.fromBase58Check(poxAddress);
  const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
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
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
})

test('delegator commit', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const network = new StacksTestnet();
  const rewardCycle = 10;
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const delegateResults = await client.stackAggregationCommit({
    poxAddress,
    rewardCycle,
    privateKey,
  });

  const { version, hash } = btcAddress.fromBase58Check(poxAddress);
  const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
  const hashbytes = bufferCV(hash);
  const poxAddressCV = tupleCV({
    hashbytes,
    version: versionBuffer,
  });

  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'stack-aggregation-commit',
    functionArgs: [
      poxAddressCV,
      uintCV(rewardCycle),
    ],
    validateWithAbi: true,
    network,
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(delegateResults).toEqual(broadcastResponse);
})

test('revoke delegate stx', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();
  const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

  const transaction = { serialize: () => 'mocktxhex' }
  const makeContractCall = jest.fn().mockResolvedValue(transaction);
  const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
  const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

  jest.mock('@stacks/transactions', () => ({
    makeContractCall,
    broadcastTransaction,
    bufferCV: jest.requireActual('@stacks/transactions').bufferCV,
    tupleCV: jest.requireActual('@stacks/transactions').tupleCV,
    uintCV: jest.requireActual('@stacks/transactions').uintCV,
    AddressHashMode: jest.requireActual('@stacks/transactions').AddressHashMode,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }));

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const revokeDelegateResults = await client.revokeDelegateStx(privateKey);


  const expectedContractCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'revoke-delegate-stx',
    functionArgs: [],
    validateWithAbi: true,
    network,
    senderKey: privateKey
  };

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(makeContractCall).toHaveBeenCalledTimes(1);
  expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
  expect(broadcastTransaction).toHaveBeenCalledTimes(1);
  expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
  expect(revokeDelegateResults).toEqual(broadcastResponse);
})


test('get stacking status', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();
  const amountMicrostx = 10000;
  const firstRewardCycle = 10;
  const lockPeriod = 20;
  const version = '00';
  const hashbytes = '05cf52a44bf3e6829b4f8c221cc675355bf83b7d';

  const functionCallResponse = someCV(tupleCV({
    "amount-ustx": uintCV(amountMicrostx),
    "first-reward-cycle": uintCV(firstRewardCycle),
    "lock-period": uintCV(lockPeriod),
    "pox-addr": tupleCV({
      "version": bufferCV(Buffer.from(version)),
      "hashbytes": bufferCV(Buffer.from(hashbytes))
    })
  }));

  const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

  jest.mock('@stacks/transactions', () => ({
    callReadOnlyFunction,
    cvToString: jest.requireActual('@stacks/transactions').cvToString,
    standardPrincipalCV: jest.requireActual('@stacks/transactions').standardPrincipalCV,
    ClarityType: jest.requireActual('@stacks/transactions').ClarityType,
    validateStacksAddress: jest.requireActual('@stacks/transactions').validateStacksAddress,
  }))

  fetchMock.mockResponse(request => {
    const url = request.url;
    if (url.endsWith('pox')) {
      return Promise.resolve({
        body: JSON.stringify(poxInfo),
        status: 200
      })
    } else {
      return Promise.resolve({
        body: JSON.stringify(balanceInfo),
        status: 200
      })
    }
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const stackingStatus = await client.getStatus();

  const expectedReadOnlyFunctionCallOptions = {
    contractAddress: poxInfo.contract_id.split('.')[0],
    contractName: poxInfo.contract_id.split('.')[1],
    functionName: 'get-stacker-info',
    functionArgs: [
      standardPrincipalCV(address)
    ],
    senderAddress: address,
    network
  };

  expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
  expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);
  expect(stackingStatus.stacked).toEqual(true);
  expect(stackingStatus.details.amount_microstx).toEqual(amountMicrostx.toString());
  expect(stackingStatus.details.first_reward_cycle).toEqual(firstRewardCycle);
  expect(stackingStatus.details.lock_period).toEqual(lockPeriod);
  expect(stackingStatus.details.pox_address.version.toString()).toEqual(version);
  expect(stackingStatus.details.pox_address.hashbytes.toString()).toEqual(hashbytes);
})

test('get core info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(coreInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const responseCoreInfo = await client.getCoreInfo();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getInfoUrl());
  expect(responseCoreInfo).toEqual(coreInfo);
})

test('get pox info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(poxInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const responsePoxInfo = await client.getPoxInfo();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(responsePoxInfo).toEqual(poxInfo);
})

test('get target block time info', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(blocktimeInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const responseBlockTimeInfo = await client.getTargetBlockTime();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getBlockTimeInfoUrl());
  expect(responseBlockTimeInfo).toEqual(blocktimeInfo.testnet.target_block_time);
})

test('get account balance', async () => {
  const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
  const network = new StacksTestnet();

  fetchMock.mockResponse(() => {
    return Promise.resolve({
      body: JSON.stringify(balanceInfo),
      status: 200
    })
  })

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const responseBalanceInfo = await client.getAccountBalance();

  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(responseBalanceInfo.toString()).toEqual(new BN(balanceInfo.balance.substr(2), 'hex').toString());
})
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

  const { StackingClient } = require('../src');
  const client = new StackingClient(address, network);

  const responseSecondsUntilNextCycle = await client.getSecondsUntilNextCycle();
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getBlockTimeInfoUrl());
  expect(fetchMock.mock.calls[2][0]).toEqual(network.getInfoUrl());

  // next reward cycle in 10 blocks
  expect(responseSecondsUntilNextCycle.toString()).toEqual((10 * 120).toString());
});

test('pox address hash mode', async () => {
  const p2pkh = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
  const p2pkhTestnet = 'n4RKBLKb6n9v68yMRUYm6xRCx2YkkxpSQm';
  const p2sh = '3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX';
  const p2shTestnet = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';

  const p2pkhAddrHashmode = getAddressHashMode(p2pkh);
  const p2pkhTestnetAddrHashmode = getAddressHashMode(p2pkhTestnet);
  const p2shAddrHashmode = getAddressHashMode(p2sh);
  const p2shTestnetAddrHashmode = getAddressHashMode(p2shTestnet);

  expect(p2pkhAddrHashmode).toEqual(AddressHashMode.SerializeP2PKH);
  expect(p2pkhTestnetAddrHashmode).toEqual(AddressHashMode.SerializeP2PKH);
  expect(p2shAddrHashmode).toEqual(AddressHashMode.SerializeP2SH);
  expect(p2shTestnetAddrHashmode).toEqual(AddressHashMode.SerializeP2SH);

  const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
  const p2wpkhTestnet = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
  const p2wsh = 'bc1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4sqsth99';
  const p2wshTestnet = 'tb1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4shcacl2';
  
  expect(() => getAddressHashMode(p2wpkh)).toThrowError(InvalidAddressError);
  expect(() => getAddressHashMode(p2wpkhTestnet)).toThrowError(InvalidAddressError);
  expect(() => getAddressHashMode(p2wsh)).toThrowError(InvalidAddressError);
  expect(() => getAddressHashMode(p2wshTestnet)).toThrowError(InvalidAddressError);

  expect(() => decodeBtcAddress(p2wpkh)).toThrowError(InvalidAddressError);
  expect(() => decodeBtcAddress(p2wpkhTestnet)).toThrowError(InvalidAddressError);
  expect(() => decodeBtcAddress(p2wsh)).toThrowError(InvalidAddressError);
  expect(() => decodeBtcAddress(p2wshTestnet)).toThrowError(InvalidAddressError);
})
