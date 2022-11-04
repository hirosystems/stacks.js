import { hexToBytes } from '@stacks/common';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

import { StackingClient } from '../src';
import { PoxOperationPeriod } from '../src/constants';
import {
  MOCK_EMPTY_ACCOUNT,
  MOCK_FULL_ACCOUNT,
  MOCK_POX_2_REGTEST,
  setApiMocks,
  V2_POX_INTERFACE_POX_2,
  waitForBlock,
  waitForTx,
} from './apiMockingHelpers';
import { BTC_ADDRESS_CASES } from './utils.test';

const API_URL = 'http://localhost:3999'; // use regtest for e2e tests

beforeEach(() => {
  jest.resetModules();
  fetchMock.resetMocks();
});

describe('2.1 periods', () => {
  test('period 1 -- mainnet before 2.1 fork', async () => {
    setApiMocks({
      '/v2/pox': `{"contract_id":"SP000000000000000000002Q6VF78.pox","pox_activation_threshold_ustx":66818426279656,"first_burnchain_block_height":666050,"prepare_phase_block_length":100,"reward_phase_block_length":2000,"reward_slots":4000,"rejection_fraction":25,"total_liquid_supply_ustx":1336368525593131,"current_cycle":{"id":42,"min_threshold_ustx":140000000000,"stacked_ustx":528062660869340,"is_pox_active":true},"next_cycle":{"id":43,"min_threshold_ustx":120000000000,"min_increment_ustx":66818426279,"stacked_ustx":441243465796508,"prepare_phase_start_block_height":756250,"blocks_until_prepare_phase":182,"reward_phase_start_block_height":756350,"blocks_until_reward_phase":282,"ustx_until_pox_rejection":334092131398275},"min_amount_ustx":120000000000,"prepare_cycle_length":100,"reward_cycle_id":42,"reward_cycle_length":2100,"rejection_votes_left_required":334092131398275,"next_reward_cycle_in":282}`,
    });

    const network = new StacksMainnet();
    const client = new StackingClient('', network);

    const periodInfo = await client.getPoxOperationInfo();
    expect(periodInfo.period).toBe(1);
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period1);
  });

  test('period 1 -- next/regtest before 2.1 fork', async () => {
    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":108,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":21,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":109,"blocks_until_prepare_phase":1,"reward_phase_start_block_height":110,"blocks_until_reward_phase":2,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":21,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":2,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `Data var not found`, // 404
    });

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient('', network);

    const periodInfo = await client.getPoxOperationInfo();
    expect(periodInfo.period).toBe(1);
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period1);
  });

  test('period 2 -- after 2.1 fork, before first pox-2 cycle', async () => {
    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":111,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":23,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":114,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":115,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":22,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `{"data":"0x03"}`,
    });

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient('', network);

    const periodInfo = await client.getPoxOperationInfo();
    if (periodInfo.period !== 2) throw Error;

    expect(periodInfo.period).toBe(2);
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period2);
    expect(periodInfo.blocks_until_pox_2).toBe(9);
  });

  test('period 3', async () => {
    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-2","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":121,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":24,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":25,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":124,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":125,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":24,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `{"data":"0x03"}`,
    });

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient('', network);

    const periodInfo = await client.getPoxOperationInfo();
    expect(periodInfo.period).toBe(3);
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period3);
  });
});

describe('stacking eligibility', () => {
  test('eligible', async () => {
    setApiMocks(MOCK_FULL_ACCOUNT);

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

  test('not eligible', async () => {
    setApiMocks(MOCK_EMPTY_ACCOUNT);

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
});

describe('stacking transition', () => {
  test('locked stx unlock automatically on period 3', async () => {
    // Prerequisites:
    // * Assumming a freshly booted (or epoch 2.05) regtest around block ~100
    // * 2.1 fork at block 110 (`STACKS_21_HEIGHT=110`)
    // * PoX-2 activation at block 120 (`STACKS_POX2_HEIGHT=120`)
    //
    // Step-by-step:
    // * User stacks for a long time (12 cycles, which is around 70 blocks in regtest)
    //   * We are in `Period 1`
    //   * Users funds are stacked
    // * We wait until after the fork (block 111)
    //   * We are in `Period 2`
    //   * Users funds are still stacked
    // * We wait until after PoX-2 activation (block 121)
    //   * We are in `Period 3`
    //   * Users funds are no longer locked

    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);

    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":108,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":21,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":109,"blocks_until_prepare_phase":1,"reward_phase_start_block_height":110,"blocks_until_reward_phase":2,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":21,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":2,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc10000","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox/get-stacker-info': `{"okay":true,"result":"0x09"}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `Data var not found`,
      '/v2/contracts/interface/ST000000000000000000002AMW42H/pox': V2_POX_INTERFACE_POX_2,
    });
    let poxInfo = await client.getPoxInfo();
    let status = await client.getStatus();
    expect(status.stacked).toBeFalsy();

    let poxOperation = await client.getPoxOperationInfo();
    expect(poxOperation.period).toBe(PoxOperationPeriod.Period1);

    const stackingResult = await client.stack({
      amountMicroStx: BigInt(poxInfo.min_amount_ustx),
      burnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 1,
      cycles: 12,
      poxAddress,
      privateKey,
    });
    await waitForTx(stackingResult.txid);

    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":109,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":21,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":1875180000000000,"prepare_phase_start_block_height":109,"blocks_until_prepare_phase":0,"reward_phase_start_block_height":110,"blocks_until_reward_phase":1,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":21,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":1,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd7b11f6a0f0","locked":"0x00000000000000000006a9775dca3800","unlock_height":170,"nonce":1}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox/get-stacker-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a9775dca38001266697273742d7265776172642d6379636c6501000000000000000000000000000000160b6c6f636b2d706572696f64010000000000000000000000000000000c08706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100"}`,
    });
    status = await client.getStatus();
    if (!status.stacked) throw Error;
    const initialUnlockHeight = status.details.unlock_height;

    await waitForBlock(111, client);

    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":111,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":21,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":1875180000000000,"prepare_phase_start_block_height":114,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":115,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":21,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `{"data":"0x03"}`,
    });
    poxOperation = await client.getPoxOperationInfo();
    expect(poxOperation.period).toBe(PoxOperationPeriod.Period2);

    await waitForBlock(121, client);

    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-2","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":121,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":24,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":25,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":124,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":125,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":24,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
      '/v2/data_var/ST000000000000000000002AMW42H/pox-2/configured?proof=0': `{"data":"0x03"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0d8f0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":1}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
    });
    poxInfo = await client.getPoxInfo();
    expect(poxInfo.current_burnchain_block_height).toBeLessThan(initialUnlockHeight);
    poxOperation = await client.getPoxOperationInfo();
    expect(poxOperation.period).toBe(PoxOperationPeriod.Period3);
    status = await client.getStatus();
    expect(status.stacked).toBeFalsy();
    const balanceLocked = await client.getAccountBalanceLocked();
    expect(balanceLocked).toBe(0n);
  });
});

describe('normal stacking', () => {
  test('stack stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbe67f0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":17}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
    });

    const poxInfo = await client.getPoxInfo();
    let status = await client.getStatus();
    expect(status.stacked).toBeFalsy();

    const stackingResult = await client.stack({
      amountMicroStx: BigInt(poxInfo.min_amount_ustx),
      burnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 1,
      cycles: 2,
      poxAddress,
      privateKey,
    });
    await waitForTx(stackingResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd687194e8e0","locked":"0x00000000000000000006a989fe295800","unlock_height":2675,"nonce":18}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000002150b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b0000000201000000000000000000000000000000000100000000000000000000000000000000"}`,
    });

    status = await client.getStatus();
    expect(status.stacked).toBeTruthy();
  });

  test('stack and extend stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0b1e0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":2}`,
    });
    const poxInfo = await client.getPoxInfo();

    const BEGIN_LOCK_HEIGHT = (poxInfo.current_burnchain_block_height as number) + 2;
    const stackingResult = await client.stack({
      amountMicroStx: BigInt(poxInfo.min_amount_ustx),
      burnBlockHeight: BEGIN_LOCK_HEIGHT,
      cycles: 2,
      poxAddress,
      privateKey,
    });
    await waitForTx(stackingResult.txid);
    await waitForBlock(BEGIN_LOCK_HEIGHT + 1, client);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd7b11f652d0","locked":"0x00000000000000000006a9775dca3800","unlock_height":175,"nonce":3}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000000210b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b0000000201000000000000000000000000000000000100000000000000000000000000000000"}`,
    });
    const initialStatus = await client.getStatus();
    if (!initialStatus.stacked) throw Error;

    const EXTEND_BY = 2;
    const extendResult = await client.stackExtend({
      extendCycles: EXTEND_BY,
      poxAddress,
      privateKey,
    });
    await waitForTx(extendResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd7b11f62bc0","locked":"0x00000000000000000006a9775dca3800","unlock_height":185,"nonce":4}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000000210b6c6f636b2d706572696f64010000000000000000000000000000000408706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b000000040100000000000000000000000000000000010000000000000000000000000000000001000000000000000000000000000000000100000000000000000000000000000000"}`,
    });
    const finalStatus = await client.getStatus();
    if (!finalStatus.stacked) throw Error;

    const expectedHeight =
      initialStatus?.details.unlock_height +
      EXTEND_BY * (poxInfo.prepare_phase_block_length + poxInfo.reward_phase_block_length);
    expect(finalStatus?.details.unlock_height).toBe(expectedHeight);
  });

  test('stack and increase stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc063c0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":4}`,
    });
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
    await waitForTx(stackingResult.txid);
    await waitForBlock(BEGIN_LOCK_HEIGHT + 3, client);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd71c1c674b0","locked":"0x00000000000000000006a980adf9c800","unlock_height":1465,"nonce":5}`,
    });
    const initialBalanceLocked = await client.getAccountBalanceLocked();
    if (initialBalanceLocked === 0n) throw Error;

    const INCREASE_BY = 40_000_000n;
    const increaseResult = await client.stackIncrease({
      increaseBy: INCREASE_BY,
      privateKey,
    });
    await waitForTx(increaseResult.txid);

    setApiMocks({
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd71bf63f3a0","locked":"0x00000000000000000006a980b05c2200","unlock_height":1465,"nonce":6}`,
    });
    const finalBalanceLocked = await client.getAccountBalanceLocked();
    if (finalBalanceLocked === 0n) throw Error;

    const expectedBalanceLocked = initialBalanceLocked + INCREASE_BY;
    expect(finalBalanceLocked).toBe(expectedBalanceLocked);
  });
});

describe('delegated stacking', () => {
  test('delegate stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-delegation-info': `{"okay":true,"result":"0x09"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbdf2c0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":20}`,
    });

    let status = await client.getDelegationStatus();
    expect(status.delegated).toBeFalsy();

    const poxInfo = await client.getPoxInfo();
    const delegationResult = await client.delegateStx({
      delegateTo,
      amountMicroStx: BigInt(poxInfo.min_amount_ustx),
      untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 5,
      poxAddress,
      privateKey,
    });
    await waitForTx(delegationResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a9b192f37c000c64656c6567617465642d746f051aa8cf5b9a7d1a2a4305f78c92ba50040382484bd408706f782d616464720a0c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000001eb4"}`,
    });

    status = await client.getDelegationStatus();
    expect(status.delegated).toBeTruthy();
  });

  test('delegate stack, and delegator stack', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

    const delegatorPrivateKey =
      '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);
    const delegatorClient = new StackingClient(delegatorAddress, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbdcbb0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":21}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc08ad0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":3}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d75737478010000000000000000000354d8c979be000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000001f14"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
    });

    let poxInfo = await client.getPoxInfo();
    const amount = BigInt(poxInfo.min_amount_ustx) / 2n;

    const delegationResult = await client.delegateStx({
      delegateTo: delegatorAddress,
      amountMicroStx: amount,
      untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
      poxAddress: delegatorPoxAddress,
      privateKey,
    });
    await waitForTx(delegationResult.txid);

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
    await waitForTx(stackingResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x000000000000000000203219a6437170","locked":"0x0000000000000000000354d8c979be00","unlock_height":8000,"nonce":25}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c65010000000000000000000000000000063e0b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

    stackingStatus = await client.getStatus();
    expect(stackingStatus.stacked).toBeTruthy();
  });

  test('delegate stack, delegator stack, and delegator extend stack', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

    const delegatorPrivateKey =
      '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);
    const delegatorClient = new StackingClient(delegatorAddress, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbce150","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":27}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc063c0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":4}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d75737478010000000000000000000354d8c979be000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000001fbd"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
    });

    let poxInfo = await client.getPoxInfo();
    const amount = BigInt(poxInfo.min_amount_ustx) / 2n;

    const delegationResult = await client.delegateStx({
      delegateTo: delegatorAddress,
      amountMicroStx: amount,
      untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
      poxAddress: delegatorPoxAddress,
      privateKey,
    });
    await waitForTx(delegationResult.txid);

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
    await waitForTx(stackingResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000006500b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x000000000000000000203219a642fc40","locked":"0x0000000000000000000354d8c979be00","unlock_height":8090,"nonce":28}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc03cb0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":5}`,
    });

    stackingStatus = await client.getStatus();
    if (!stackingStatus.stacked) throw Error;

    const EXTEND_COUNT = 2;
    const extendResult = await delegatorClient.delegateStackExtend({
      stacker: address,
      poxAddress: delegatorPoxAddress,
      extendCount: EXTEND_COUNT,
      privateKey: delegatorPrivateKey,
    });
    await waitForTx(extendResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x000000000000000000203219a642fc40","locked":"0x0000000000000000000354d8c979be00","unlock_height":8100,"nonce":28}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000006500b6c6f636b2d706572696f64010000000000000000000000000000000408706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

    const finalStatus = await client.getStatus();
    if (!finalStatus.stacked) throw Error;

    const expectedUnlockHeight =
      stackingStatus.details.unlock_height +
      EXTEND_COUNT * (poxInfo.prepare_phase_block_length + poxInfo.reward_phase_block_length);
    expect(finalStatus.details.unlock_height).toBe(expectedUnlockHeight);
    expect(finalStatus.details.unlock_height).toBeGreaterThan(stackingStatus.details.unlock_height);
  });

  test('delegate stack, delegator stack, and delegator increase stack', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

    const delegatorPrivateKey =
      '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

    const network = new StacksTestnet({ url: API_URL });
    const client = new StackingClient(address, network);
    const delegatorClient = new StackingClient(delegatorAddress, network);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbc6c20","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":30}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fbfc780","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":8}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a9b3e6ff60000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a010000000000000000000000000000206b"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
    });

    let poxInfo = await client.getPoxInfo();
    const fullAmount = BigInt(poxInfo.min_amount_ustx);

    const delegationResult = await client.delegateStx({
      delegateTo: delegatorAddress,
      amountMicroStx: fullAmount,
      untilBurnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 50,
      poxAddress: delegatorPoxAddress,
      privateKey,
    });
    await waitForTx(delegationResult.txid);

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
    await waitForTx(stackingResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002032187c3c9510","locked":"0x0000000000000000000354d9f37fb000","unlock_height":8265,"nonce":31}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fbfa070","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":9}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000006730b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

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
    await waitForTx(extendResult.txid);

    setApiMocks({
      ...MOCK_POX_2_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd3e88bce510","locked":"0x00000000000000000006a9b3e6ff6000","unlock_height":8265,"nonce":31}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x0a0c000000041266697273742d7265776172642d6379636c6501000000000000000000000000000006730b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

    stackingStatus = await client.getStatus();
    if (!stackingStatus.stacked) throw Error;

    balanceLocked = await client.getAccountBalanceLocked();
    expect(balanceLocked).toBe(fullAmount);
  });
});

describe('btc addresses', () => {
  test.each(BTC_ADDRESS_CASES)(
    'stack with btc address',
    async ({ address: btcAddress, expectedHash, expectedVersion, mockedResult }) => {
      const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
      const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

      const network = new StacksTestnet({ url: API_URL });
      const client = new StackingClient(address, network);

      setApiMocks({
        ...MOCK_POX_2_REGTEST,
        '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fbe67f0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":17}`,
        '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"0x09"}`,
      });

      const poxInfo = await client.getPoxInfo();
      const stackingResult = await client.stack({
        amountMicroStx: BigInt(poxInfo.min_amount_ustx),
        burnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 1,
        poxAddress: btcAddress,
        cycles: 2,
        privateKey,
      });
      await waitForTx(stackingResult.txid);

      setApiMocks({
        ...MOCK_POX_2_REGTEST,
        '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd687194e8e0","locked":"0x00000000000000000006a989fe295800","unlock_height":2675,"nonce":18}`,
        '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/get-stacker-info': `{"okay":true,"result":"${mockedResult}"}`,
      });

      const stackingStatus = await client.getStatus();
      if (!stackingStatus.stacked) throw Error;

      expect(stackingStatus.details.pox_address.hashbytes).toEqual(hexToBytes(expectedHash));
      expect(stackingStatus.details.pox_address.version).toHaveLength(1);
      expect(stackingStatus.details.pox_address.version[0]).toEqual(expectedVersion);
    }
  );
});
