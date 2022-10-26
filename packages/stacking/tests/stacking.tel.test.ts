import { Configuration, TransactionsApi } from '@stacks/blockchain-api-client';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';

import { StackingClient } from '../src';
import {
  enableApiMocks,
  MOCK_2_1_PERIOD1_MAINNET,
  MOCK_2_1_PERIOD1_REGTEST,
  MOCK_2_1_PERIOD3_STACKS_TEL,
  MOCK_EMPTY_ACCOUNT,
  MOCK_FULL_ACCOUNT,
} from './apiMock';

// const API_URL = 'https://stacks.tel';
const API_URL = 'http://localhost:3999';
// const API_URL = 'http://localhost:20443';

// const infoApi = new InfoApi(new Configuration({ basePath: API_URL }));
// const blockApi = new BlocksApi(new Configuration({ basePath: API_URL }));
const txApi = new TransactionsApi(new Configuration({ basePath: API_URL }));

const network = new StacksTestnet({ url: API_URL });
const client = new StackingClient('', network); // anonymous client

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTxIdSuccess(txId: string) {
  const maxIterations = 120;
  for (let i = 0; i < maxIterations; i++) {
    try {
      const txInfo = (await txApi.getTransactionById({ txId })) as any;
      if (txInfo?.tx_status == 'success') {
        console.log(`✓ ${JSON.stringify(txInfo?.tx_result)}`);
        return txInfo;
      } else if (txInfo?.tx_result) {
        return console.log(`✕ ${JSON.stringify(txInfo.tx_result)}`);
      }
    } catch (_) {}
    console.log(`waiting (${i})`);
    await sleep(1000);
  }
}

async function waitForNextBlock(burnBlockId: number) {
  const maxIterations = 120;
  let current;
  for (let i = 0; i < maxIterations; i++) {
    try {
      const poxInfo = (await client.getPoxInfo()) as any;
      current = poxInfo?.current_burnchain_block_height;
      if (current && current > burnBlockId) {
        console.log('-> next block reached');
        return poxInfo;
      }
    } catch (_) {}
    console.log(`waiting (${i}) for: ${burnBlockId}, current: ${current}`);
    await sleep(1000);
  }
}

beforeEach(() => {
  jest.setTimeout(120_000); // todo: remove timeout
  jest.resetModules();
  fetchMock.resetMocks();
});

test('getting current period (0)', async () => {
  fetchMock.dontMock();

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const period = await client.getCurrentPoxOperationPeriod();
  expect(period).toEqual(3);
});

test('getting current period (1) -- mainnet before 2.1 fork', async () => {
  enableApiMocks(MOCK_2_1_PERIOD1_MAINNET);

  const network = new StacksMainnet();
  const client = new StackingClient('', network);

  const period = await client.getCurrentPoxOperationPeriod();
  expect(period).toEqual(1);
});

test('getting current period (1) -- next/testnet before 2.1 fork', async () => {
  enableApiMocks(MOCK_2_1_PERIOD1_REGTEST);

  const network = new StacksMainnet();
  const client = new StackingClient('', network);

  const period = await client.getCurrentPoxOperationPeriod();
  expect(period).toEqual(1);
});

test('getting current period (2) -- after 2.1 fork, before first pox-2 cycle', async () => {
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient('', network);

  const period = await client.getCurrentPoxOperationPeriod();
  expect(period).toEqual(2);
});

test('getting current period (3)', async () => {
  enableApiMocks(MOCK_2_1_PERIOD3_STACKS_TEL);

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const period = await client.getCurrentPoxOperationPeriod();
  expect(period).toEqual(3);
});

test('check stacking eligibility (true)', async () => {
  enableApiMocks(MOCK_FULL_ACCOUNT);

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const network = new StacksTestnet({ url: API_URL });

  const client = new StackingClient(address, network);

  const cycles = 1;
  const stackingEligibility = await client.canStack({ poxAddress, cycles });

  expect(fetchMock.mock.calls.length).toEqual(3);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(fetchMock.mock.calls[2][0]).toContain('/pox-2/can-stack-stx');
  expect(stackingEligibility.eligible).toBe(true);
});

test('check stacking eligibility (false)', async () => {
  enableApiMocks(MOCK_EMPTY_ACCOUNT);

  const address = 'ST162GBCTD9ESBF09XC2T63NCX6ZKS42ZPWGXZ6VH';
  const poxAddress = 'mnTdnFyjxRomWaSLp4fNGSa9Gyg9XJo4j4';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const cycles = 1;
  const stackingEligibility = await client.canStack({ poxAddress, cycles });

  expect(fetchMock.mock.calls.length).toEqual(3);
  expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
  expect(fetchMock.mock.calls[1][0]).toEqual(network.getPoxInfoUrl());
  expect(fetchMock.mock.calls[2][0]).toContain('/pox-2/can-stack-stx');
  expect(stackingEligibility.eligible).toBe(false);
  expect(stackingEligibility.reason).toBe('ERR_STACKING_THRESHOLD_NOT_MET');
});

test('stack and extend stx', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const poxInfo = await client.getPoxInfo();

  const BEGIN_LOCK_HEIGHT = (poxInfo.current_burnchain_block_height as number) + 2;
  const stackingResult = await client.stack({
    amountMicroStx: BigInt(poxInfo.min_amount_ustx),
    burnBlockHeight: BEGIN_LOCK_HEIGHT,
    cycles: 2,
    poxAddress,
    privateKey,
  });

  await waitForTxIdSuccess(stackingResult.txid);
  await waitForNextBlock(BEGIN_LOCK_HEIGHT);

  const initialStatus = await client.getStatus();
  if (!initialStatus.stacked) throw Error;

  const EXTEND_BY = 2;
  const extendResult = await client.stackExtend({
    extendCycles: EXTEND_BY,
    poxAddress,
    privateKey,
  });

  await waitForTxIdSuccess(extendResult.txid);

  const finalStatus = await client.getStatus();
  if (!finalStatus.stacked) throw Error;

  const expectedHeight =
    initialStatus?.details.unlock_height +
    EXTEND_BY * (poxInfo.prepare_phase_block_length + poxInfo.reward_phase_block_length);
  expect(finalStatus?.details.unlock_height).toBe(expectedHeight);
});

test('stack and increase stx', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const poxInfo = await client.getPoxInfo();

  const BEGIN_LOCK_HEIGHT = (poxInfo.current_burnchain_block_height as number) + 2;
  const INITIAL_AMOUNT = BigInt(poxInfo.min_amount_ustx);
  const stackingResult = await client.stack({
    amountMicroStx: INITIAL_AMOUNT,
    burnBlockHeight: BEGIN_LOCK_HEIGHT,
    cycles: 10,
    poxAddress,
    privateKey,
  });

  await waitForTxIdSuccess(stackingResult.txid);
  await waitForNextBlock(BEGIN_LOCK_HEIGHT + 2);

  const initialBalanceLocked = await client.getAccountBalanceLocked();
  if (initialBalanceLocked === 0n) throw Error;

  const INCREASE_BY = 40_000_000n;
  const increaseResult = await client.stackIncrease({
    increaseBy: INCREASE_BY,
    privateKey,
  });

  await waitForTxIdSuccess(increaseResult.txid);

  const finalBalanceLocked = await client.getAccountBalanceLocked();
  if (finalBalanceLocked === 0n) throw Error;

  const expectedBalanceLocked = initialBalanceLocked + INCREASE_BY;
  expect(finalBalanceLocked).toBe(expectedBalanceLocked);
});

test('stack stx', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const poxInfo = await client.getPoxInfo();

  const stackingResult = await client.stack({
    amountMicroStx: BigInt(poxInfo.min_amount_ustx),
    burnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 1,
    cycles: 2,
    poxAddress,
    privateKey,
  });
  console.log('stackingResult', stackingResult);
});

test('delegate stack stx', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const poxInfo = await client.getPoxInfo();

  const delegationResult = await client.delegateStx({
    delegateTo,
    amountMicroStx: BigInt(poxInfo.min_amount_ustx),
    untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 5,
    poxAddress,
    privateKey,
  });
  await waitForTxIdSuccess(delegationResult.txid);
});

test('delegate stack, and delegator stack', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const delegatorPrivateKey = '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
  const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
  const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);
  const delegatorClient = new StackingClient(delegatorAddress, network);

  let poxInfo = await client.getPoxInfo();
  const amount = BigInt(poxInfo.min_amount_ustx) / 2n;

  const delegationResult = await client.delegateStx({
    delegateTo: delegatorAddress,
    amountMicroStx: amount,
    untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
    poxAddress: delegatorPoxAddress,
    privateKey,
  });
  await waitForTxIdSuccess(delegationResult.txid);

  const delegationStatus = await client.getDelegationStatus();
  expect(delegationStatus.delegated).toBeTruthy();

  let stackingStatus = await client.getStatus();
  expect(stackingStatus.stacked).toBeFalsy();

  poxInfo = await client.getPoxInfo();
  const stackingResult = await delegatorClient.delegateStackStx({
    stacker: address,
    amountMicroStx: amount,
    burnBlockHeight: poxInfo.current_burnchain_block_height as number,
    cycles: 2,
    poxAddress: delegatorPoxAddress,
    privateKey: delegatorPrivateKey,
  });
  await waitForTxIdSuccess(stackingResult.txid);

  stackingStatus = await client.getStatus();
  expect(stackingStatus.stacked).toBeTruthy();
});

test('delegate stack, delegator stack, and delegator extend stack', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const delegatorPrivateKey = '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
  const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
  const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);
  const delegatorClient = new StackingClient(delegatorAddress, network);

  let poxInfo = await client.getPoxInfo();
  const amount = BigInt(poxInfo.min_amount_ustx) / 2n;

  const delegationResult = await client.delegateStx({
    delegateTo: delegatorAddress,
    amountMicroStx: amount,
    untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
    poxAddress: delegatorPoxAddress,
    privateKey,
  });
  await waitForTxIdSuccess(delegationResult.txid);

  const delegationStatus = await client.getDelegationStatus();
  expect(delegationStatus.delegated).toBeTruthy();

  let stackingStatus = await client.getStatus();
  expect(stackingStatus.stacked).toBeFalsy();

  poxInfo = await client.getPoxInfo();
  const stackingResult = await delegatorClient.delegateStackStx({
    stacker: address,
    amountMicroStx: amount,
    burnBlockHeight: poxInfo.current_burnchain_block_height as number,
    cycles: 2,
    poxAddress: delegatorPoxAddress,
    privateKey: delegatorPrivateKey,
  });
  await waitForTxIdSuccess(stackingResult.txid);

  stackingStatus = await client.getStatus();
  if (!stackingStatus.stacked) throw Error;

  const EXTEND_COUNT = 2;
  const extendResult = await delegatorClient.delegateStackExtend({
    stacker: address,
    poxAddress: delegatorPoxAddress,
    extendCount: EXTEND_COUNT,
    privateKey: delegatorPrivateKey,
  });
  await waitForTxIdSuccess(extendResult.txid);

  const finalStatus = await client.getStatus();
  if (!finalStatus.stacked) throw Error;

  const expectedUnlockHeight =
    stackingStatus.details.unlock_height +
    EXTEND_COUNT * (poxInfo.prepare_phase_block_length + poxInfo.reward_phase_block_length);
  expect(finalStatus.details.unlock_height).toBe(expectedUnlockHeight);
  expect(finalStatus.details.unlock_height).toBeGreaterThan(stackingStatus.details.unlock_height);
});

test('delegate stack, delegator stack, and delegator increase stack', async () => {
  fetchMock.dontMock();

  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const delegatorPrivateKey = '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
  const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
  const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);
  const delegatorClient = new StackingClient(delegatorAddress, network);

  let poxInfo = await client.getPoxInfo();
  const fullAmount = BigInt(poxInfo.min_amount_ustx);

  const delegationResult = await client.delegateStx({
    delegateTo: delegatorAddress,
    amountMicroStx: fullAmount,
    untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
    poxAddress: delegatorPoxAddress,
    privateKey,
  });
  await waitForTxIdSuccess(delegationResult.txid);

  const delegationStatus = await client.getDelegationStatus();
  expect(delegationStatus.delegated).toBeTruthy();

  let stackingStatus = await client.getStatus();
  expect(stackingStatus.stacked).toBeFalsy();

  poxInfo = await client.getPoxInfo();
  const stackingResult = await delegatorClient.delegateStackStx({
    stacker: address,
    amountMicroStx: fullAmount / 2n,
    burnBlockHeight: poxInfo.current_burnchain_block_height as number,
    cycles: 2,
    poxAddress: delegatorPoxAddress,
    privateKey: delegatorPrivateKey,
  });
  await waitForTxIdSuccess(stackingResult.txid);

  stackingStatus = await client.getStatus();
  if (!stackingStatus.stacked) throw Error;

  let balanceLocked = await client.getAccountBalanceLocked();
  expect(balanceLocked).toBe(fullAmount / 2n);

  const extendResult = await delegatorClient.delegateStackIncrease({
    stacker: address,
    poxAddress: delegatorPoxAddress,
    increaseBy: fullAmount / 2n,
    privateKey: delegatorPrivateKey,
  });
  await waitForTxIdSuccess(extendResult.txid);

  stackingStatus = await client.getStatus();
  if (!stackingStatus.stacked) throw Error;

  balanceLocked = await client.getAccountBalanceLocked();
  expect(balanceLocked).toBe(fullAmount);
});

test('tmp poxinfo', async () => {
  fetchMock.dontMock();

  console.log(await client.getPoxInfo());
});

test('tmp account stacking status', async () => {
  fetchMock.dontMock();

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  console.log(await client.getStatus());
});

test('tmp account delegation status', async () => {
  fetchMock.dontMock();

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  console.log(await client.getDelegationStatus());
});

test('tmp account balance', async () => {
  fetchMock.dontMock();

  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  console.log(await client.getAccountBalance());
});

test('tmp block height', async () => {
  fetchMock.dontMock();
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  // console.log(await client.getAccountStatus());
  // console.log(await client.getAccountBalance());
  // console.log(await client.getStatus());
  // console.log('seconds', await client.getSecondsUntilNextCycle());
  console.log(
    'current_burnchain_block_height',
    (await client.getPoxInfo()).current_burnchain_block_height
  );
});

test('tmp revoke delegation', async () => {
  fetchMock.dontMock();
  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const network = new StacksTestnet({ url: API_URL });
  const client = new StackingClient(address, network);

  const { txid } = await client.revokeDelegateStx(privateKey);
  await waitForTxIdSuccess(txid);
});

// test('delegate stx', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
//   const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
//   const network = new StacksTestnet();
//   const amountMicroStx = BigInt(100000000000);
//   const untilBurnBlockHeight = 2000;
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(poxInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const delegateResults = await client.delegateStx({
//     amountMicroStx,
//     delegateTo,
//     untilBurnBlockHeight,
//     poxAddress,
//     privateKey,
//   });

//   const { version, hash } = base58CheckDecode(poxAddress);
//   const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
//   const hashbytes = bufferCV(hash);
//   const poxAddressCV = tupleCV({
//     hashbytes,
//     version: versionBuffer,
//   });

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'delegate-stx',
//     functionArgs: [
//       uintCV(amountMicroStx.toString(10)),
//       standardPrincipalCV(delegateTo),
//       someCV(uintCV(untilBurnBlockHeight)),
//       someCV(poxAddressCV),
//     ],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(delegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('delegate stx with empty optional parameters', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
//   const network = new StacksTestnet();
//   const amountMicroStx = BigInt(100000000000);
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(poxInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const delegateResults = await client.delegateStx({
//     amountMicroStx,
//     delegateTo,
//     untilBurnBlockHeight: undefined,
//     poxAddress: undefined,
//     privateKey,
//   });

//   const noValue = noneCV();

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'delegate-stx',
//     functionArgs: [
//       uintCV(amountMicroStx.toString(10)),
//       standardPrincipalCV(delegateTo),
//       noValue,
//       noValue,
//     ],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(delegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('delegate stack stx with one delegator', async () => {
//   const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
//   const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
//   const network = new StacksTestnet();
//   const amountMicroStx = BigInt(100000000000);
//   const burnBlockHeight = 2000;
//   const cycles = 10;
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(request => {
//     const url = request.url;
//     if (url.endsWith('pox')) {
//       return Promise.resolve({
//         body: JSON.stringify(poxInfo),
//         status: 200,
//       });
//     } else {
//       return Promise.resolve({
//         body: JSON.stringify(balanceInfo),
//         status: 200,
//       });
//     }
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const delegateResults = await client.delegateStackStx({
//     stacker,
//     amountMicroStx,
//     poxAddress,
//     burnBlockHeight,
//     cycles,
//     privateKey,
//   });

//   const { version, hash } = base58CheckDecode(poxAddress);
//   const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
//   const hashbytes = bufferCV(hash);
//   const poxAddressCV = tupleCV({
//     hashbytes,
//     version: versionBuffer,
//   });

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'delegate-stack-stx',
//     functionArgs: [
//       standardPrincipalCV(stacker),
//       uintCV(amountMicroStx.toString(10)),
//       poxAddressCV,
//       uintCV(burnBlockHeight),
//       uintCV(cycles),
//     ],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(delegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('delegate stack stx with set nonce', async () => {
//   const stacker = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const address = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
//   const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
//   const network = new StacksTestnet();
//   const amountMicroStx = BigInt(100000000000);
//   const burnBlockHeight = 2000;
//   const cycles = 10;
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
//   const nonce = BigInt(1);

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(request => {
//     const url = request.url;
//     if (url.endsWith('pox')) {
//       return Promise.resolve({
//         body: JSON.stringify(poxInfo),
//         status: 200,
//       });
//     } else {
//       return Promise.resolve({
//         body: JSON.stringify(balanceInfo),
//         status: 200,
//       });
//     }
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const delegateResults = await client.delegateStackStx({
//     stacker,
//     amountMicroStx,
//     poxAddress,
//     burnBlockHeight,
//     cycles,
//     privateKey,
//     nonce,
//   });

//   const { version, hash } = base58CheckDecode(poxAddress);
//   const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
//   const hashbytes = bufferCV(hash);
//   const poxAddressCV = tupleCV({
//     hashbytes,
//     version: versionBuffer,
//   });

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'delegate-stack-stx',
//     functionArgs: [
//       standardPrincipalCV(stacker),
//       uintCV(amountMicroStx.toString(10)),
//       poxAddressCV,
//       uintCV(burnBlockHeight),
//       uintCV(cycles),
//     ],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     nonce,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(delegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('delegator commit', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
//   const network = new StacksTestnet();
//   const rewardCycle = 10;
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(poxInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const delegateResults = await client.stackAggregationCommit({
//     poxAddress,
//     rewardCycle,
//     privateKey,
//   });

//   const { version, hash } = base58CheckDecode(poxAddress);
//   const versionBuffer = bufferCV(bigIntToBytes(BigInt(version), 1));
//   const hashbytes = bufferCV(hash);
//   const poxAddressCV = tupleCV({
//     hashbytes,
//     version: versionBuffer,
//   });

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'stack-aggregation-commit',
//     functionArgs: [poxAddressCV, uintCV(rewardCycle)],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(delegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('revoke delegate stx', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();
//   const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

//   const transaction = { serialize: () => 'mocktxhex' };
//   const makeContractCall = jest.fn().mockResolvedValue(transaction);
//   const broadcastResponse = JSON.stringify({ txid: 'mocktxid' });
//   const broadcastTransaction = jest.fn().mockResolvedValue(broadcastResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     makeContractCall,
//     broadcastTransaction,
//   }));

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(poxInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const revokeDelegateResults = await client.revokeDelegateStx(privateKey);

//   const expectedContractCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'revoke-delegate-stx',
//     functionArgs: [],
//     validateWithAbi: true,
//     network,
//     senderKey: privateKey,
//     anchorMode: AnchorMode.Any,
//   };

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(makeContractCall).toHaveBeenCalledTimes(1);
//   expect(makeContractCall).toHaveBeenCalledWith(expectedContractCallOptions);
//   expect(broadcastTransaction).toHaveBeenCalledTimes(1);
//   expect(broadcastTransaction).toHaveBeenCalledWith(transaction, network);
//   expect(revokeDelegateResults).toEqual(broadcastResponse);
//   expect(isPoxAbiValid(expectedContractCallOptions)).toBe(true);
// });

// test('get stacking status', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();
//   const amountMicrostx = 10_000;
//   const firstRewardCycle = 10;
//   const lockPeriod = 20;
//   const version = '00';
//   const hashbytes = '05cf52a44bf3e6829b4f8c221cc675355bf83b7d';

//   const functionCallResponse = someCV(
//     tupleCV({
//       'amount-ustx': uintCV(amountMicrostx),
//       'first-reward-cycle': uintCV(firstRewardCycle),
//       'lock-period': uintCV(lockPeriod),
//       'pox-addr': tupleCV({
//         version: bufferCV(hexToBytes(version)),
//         hashbytes: bufferCV(hexToBytes(hashbytes)),
//       }),
//     })
//   );

//   const callReadOnlyFunction = jest.fn().mockResolvedValue(functionCallResponse);

//   jest.mock('@stacks/transactions', () => ({
//     ...jest.requireActual('@stacks/transactions'),
//     callReadOnlyFunction,
//   }));

//   fetchMock.mockResponse(request => {
//     const url = request.url;
//     if (url.endsWith('pox')) {
//       return Promise.resolve({
//         body: JSON.stringify(poxInfo),
//         status: 200,
//       });
//     } else {
//       return Promise.resolve({
//         body: JSON.stringify(balanceInfo),
//         status: 200,
//       });
//     }
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const stackingStatus = await client.getStatus();

//   const expectedReadOnlyFunctionCallOptions = {
//     contractAddress: poxInfo.contract_id.split('.')[0],
//     contractName: poxInfo.contract_id.split('.')[1],
//     functionName: 'get-stacker-info',
//     functionArgs: [standardPrincipalCV(address)],
//     senderAddress: address,
//     network,
//   };

//   expect(callReadOnlyFunction).toHaveBeenCalledTimes(1);
//   expect(callReadOnlyFunction).toHaveBeenCalledWith(expectedReadOnlyFunctionCallOptions);

//   expect(stackingStatus.stacked).toEqual(true);
//   expect(stackingStatus.details.first_reward_cycle).toEqual(firstRewardCycle);
//   expect(stackingStatus.details.lock_period).toEqual(lockPeriod);
//   expect(bytesToHex(stackingStatus.details.pox_address.version)).toEqual(version);
//   expect(bytesToHex(stackingStatus.details.pox_address.hashbytes)).toEqual(hashbytes);
//   expect(isPoxAbiValid(expectedReadOnlyFunctionCallOptions)).toBe(true);
// });

// test('get core info', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(coreInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const responseCoreInfo = await client.getCoreInfo();

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getInfoUrl());
//   expect(responseCoreInfo).toEqual(coreInfo);
// });

// test('get pox info', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(poxInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const responsePoxInfo = await client.getPoxInfo();

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(responsePoxInfo).toEqual(poxInfo);
// });

// test('get a list of burnchain rewards for the set address', async () => {
//   const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(rewardsInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);
//   const options = { limit: 2, offset: 0 };
//   const response = await client.getRewardsForBtcAddress(options);

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardsUrl(address, options));
//   expect(response).toEqual(rewardsInfo);
// });

// test('get the burnchain rewards total for the set address', async () => {
//   const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(rewardsTotalInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);
//   const response = await client.getRewardsTotalForBtcAddress();

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardsTotalUrl(address));
//   expect(response).toEqual(rewardsTotalInfo);
// });

// test('get a list of burnchain reward holders for the set address ', async () => {
//   const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(rewardHoldersInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);
//   const options = { limit: 2, offset: 0 };
//   const response = await client.getRewardHoldersForBtcAddress(options);

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getRewardHoldersUrl(address, options));
//   expect(response).toEqual(rewardHoldersInfo);
// });

// test('get target block time info', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(blocktimeInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const responseBlockTimeInfo = await client.getTargetBlockTime();

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getBlockTimeInfoUrl());
//   expect(responseBlockTimeInfo).toEqual(blocktimeInfo.testnet.target_block_time);
// });

// test('get account balance', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();

//   fetchMock.mockResponse(() => {
//     return Promise.resolve({
//       body: JSON.stringify(balanceInfo),
//       status: 200,
//     });
//   });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const responseBalanceInfo = await client.getAccountBalance();

//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getAccountApiUrl(address));
//   expect(responseBalanceInfo.toString()).toEqual(BigInt(balanceInfo.balance).toString());
// });

// test('get seconds until next cycle', async () => {
//   const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
//   const network = new StacksTestnet();

//   fetchMock
//     .mockResponseOnce(() => {
//       return Promise.resolve({
//         body: JSON.stringify(poxInfo),
//         status: 200,
//       });
//     })
//     .mockResponseOnce(() => {
//       return Promise.resolve({
//         body: JSON.stringify(blocktimeInfo),
//         status: 200,
//       });
//     })
//     .mockResponseOnce(() => {
//       return Promise.resolve({
//         body: JSON.stringify(coreInfo),
//         status: 200,
//       });
//     });

//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const { StackingClient } = require('../src'); // needed for jest.mock module
//   const client = new StackingClient(address, network);

//   const responseSecondsUntilNextCycle = await client.getSecondsUntilNextCycle();
//   expect(fetchMock.mock.calls[0][0]).toEqual(network.getPoxInfoUrl());
//   expect(fetchMock.mock.calls[1][0]).toEqual(network.getBlockTimeInfoUrl());
//   expect(fetchMock.mock.calls[2][0]).toEqual(network.getInfoUrl());

//   // next reward cycle in 10 blocks
//   expect(responseSecondsUntilNextCycle.toString()).toEqual((10 * 120).toString());
// });

// test('pox address hash mode', async () => {
//   const p2pkh = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
//   const p2pkhTestnet = 'n4RKBLKb6n9v68yMRUYm6xRCx2YkkxpSQm';
//   const p2sh = '3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX';
//   const p2shTestnet = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';

//   const p2pkhAddrHashmode = getAddressVersion(p2pkh);
//   const p2pkhTestnetAddrHashmode = getAddressVersion(p2pkhTestnet);
//   const p2shAddrHashmode = getAddressVersion(p2sh);
//   const p2shTestnetAddrHashmode = getAddressVersion(p2shTestnet);

//   expect(p2pkhAddrHashmode).toEqual(AddressHashMode.SerializeP2PKH);
//   expect(p2pkhTestnetAddrHashmode).toEqual(AddressHashMode.SerializeP2PKH);
//   expect(p2shAddrHashmode).toEqual(AddressHashMode.SerializeP2SH);
//   expect(p2shTestnetAddrHashmode).toEqual(AddressHashMode.SerializeP2SH);

//   const p2wpkh = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
//   const p2wpkhTestnet = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
//   const p2wsh = 'bc1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4sqsth99';
//   const p2wshTestnet = 'tb1qup6umurcl7s6zw42gcxfzl346psazws74x72ty6gmlvkaxz6kv4shcacl2';

//   expect(() => getAddressVersion(p2wpkh)).toThrowError(InvalidAddressError);
//   expect(() => getAddressVersion(p2wpkhTestnet)).toThrowError(InvalidAddressError);
//   expect(() => getAddressVersion(p2wsh)).toThrowError(InvalidAddressError);
//   expect(() => getAddressVersion(p2wshTestnet)).toThrowError(InvalidAddressError);

//   expect(() => decodeBtcAddress(p2wpkh)).toThrowError(InvalidAddressError);
//   expect(() => decodeBtcAddress(p2wpkhTestnet)).toThrowError(InvalidAddressError);
//   expect(() => decodeBtcAddress(p2wsh)).toThrowError(InvalidAddressError);
//   expect(() => decodeBtcAddress(p2wshTestnet)).toThrowError(InvalidAddressError);
// });

// test('pox address to btc address', () => {
//   const vectors: {
//     version: Uint8Array;
//     hashBytes: Uint8Array;
//     network: 'mainnet' | 'testnet';
//     expectedBtcAddr: string;
//   }[] = [
//     {
//       version: new Uint8Array([0x01]),
//       hashBytes: hexToBytes('07366658d1e5f0f75c585a17b618b776f4f10a6b'),
//       network: 'mainnet',
//       expectedBtcAddr: '32M9pegJxqXBoxXSKBN1s7HJUR2YMkMaFg',
//     },
//     {
//       version: new Uint8Array([0x01]),
//       hashBytes: hexToBytes('9b24b88b1334b0a17a99c09470c4df06ffd3ea22'),
//       network: 'mainnet',
//       expectedBtcAddr: '3FqLegt1Lo1JuhiBAQQiM5WwDdmefTo5zd',
//     },
//     {
//       version: new Uint8Array([0x00]),
//       hashBytes: hexToBytes('fde9c82d7bc43f55e9054438470c3ca8d6e7237f'),
//       network: 'mainnet',
//       expectedBtcAddr: '1Q9a1zGPfJ4oH5Xaz5wc7BdvWV21fSNkkr',
//     },
//     {
//       version: new Uint8Array([0x00]),
//       hashBytes: hexToBytes('5dc795522f81dcb7eb774a0b8e84b612e3edc141'),
//       network: 'testnet',
//       expectedBtcAddr: 'mp4pEBdJiMh6aL5Uhs6nZX1XhyZ4V2xrzg',
//     },
//     {
//       version: new Uint8Array([0x01]),
//       hashBytes: hexToBytes('3149c3eba2d21cfdeea56894866b8f4cd11b72ad'),
//       network: 'testnet',
//       expectedBtcAddr: '2MwjqTzEJodSaoehcxRSqfWrvJMGZHq4tdC',
//     },
//   ];

//   vectors.forEach(item => {
//     const btcAddress = poxAddressToBtcAddress(item.version, item.hashBytes, item.network);
//     expect(btcAddress).toBe(item.expectedBtcAddr);
//     const decodedAddress = decodeBtcAddress(btcAddress);
//     expect(decodedAddress.version).toBe(item.version[0]);
//     expect(bytesToHex(decodedAddress.data)).toBe(bytesToHex(item.hashBytes));
//   });

//   vectors.forEach(item => {
//     const clarityValue: TupleCV = {
//       type: ClarityType.Tuple,
//       data: {
//         version: {
//           type: ClarityType.Buffer,
//           buffer: item.version,
//         },
//         hashbytes: {
//           type: ClarityType.Buffer,
//           buffer: item.hashBytes,
//         },
//       },
//     };
//     const btcAddress = poxAddressToBtcAddress(clarityValue, item.network);
//     expect(btcAddress).toBe(item.expectedBtcAddr);
//     const decodedAddress = decodeBtcAddress(btcAddress);
//     expect(decodedAddress.version).toBe(item.version[0]);
//     expect(bytesToHex(decodedAddress.data)).toBe(bytesToHex(item.hashBytes));
//   });
// });
