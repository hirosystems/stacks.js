import { hexToBytes } from '@stacks/common';
import {
  MOCK_EMPTY_ACCOUNT,
  MOCK_FULL_ACCOUNT,
  MOCK_POX_3_REGTEST,
  V2_POX_INTERFACE_POX_3,
  V2_POX_MAINNET_POX_2,
  getFetchMockBroadcast,
  setApiMocks,
  waitForBlock,
  waitForCycle,
  waitForTx,
} from '@stacks/internal';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { ContractCallPayload, deserializeTransaction, fetchNonce } from '@stacks/transactions';
import { StackingClient, decodeBtcAddress, decodeBtcAddressBytes } from '../src';
import { PoxOperationPeriod } from '../src/constants';
import { BTC_ADDRESS_CASES } from './utils.test';

const API_URL = 'http://localhost:3999'; // default regtest url

// HOW-TO: Run tests unmocked (e.g. with a local regtest environment)
// * Add a root-level `jest.setTimeout(240_000);` with a high value to the file (outside of describe/test/before's)
// * Add `fetchMock.dontMock();` to any test that should NOT be mocked and will use the regtest

beforeEach(() => {
  jest.resetModules();
  fetchMock.resetMocks();
});

describe('2.4 activation', () => {
  test('period 3, == pox-2 -- before 2.4 fork (mainnet)', async () => {
    setApiMocks({
      '/v2/pox': V2_POX_MAINNET_POX_2,
      '/v2/data_var/SP000000000000000000002Q6VF78/pox-2/configured?proof=0': `{"data":"0x03"}`,
    });

    const client = new StackingClient({ address: '', network: STACKS_MAINNET });

    const periodInfo = await client.getPoxOperationInfo();
    if (periodInfo.period !== PoxOperationPeriod.Period3) throw 'expect period 3';

    expect(periodInfo.period).toBe('Period3');
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period3);
    expect(periodInfo.pox1.contract_id).toBe('SP000000000000000000002Q6VF78.pox');
    expect(periodInfo.pox2.contract_id).toBe('SP000000000000000000002Q6VF78.pox-2');
    expect(periodInfo.current.contract_id).toBe('SP000000000000000000002Q6VF78.pox-2');
  });

  test('period 3, >= 2.4 fork', async () => {
    setApiMocks({
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":180,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905576,"current_cycle":{"id":35,"min_threshold_ustx":1875180000000000,"stacked_ustx":1875180000000000,"is_pox_active":false},"next_cycle":{"id":36,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":1875180000000000,"prepare_phase_start_block_height":184,"blocks_until_prepare_phase":4,"reward_phase_start_block_height":185,"blocks_until_reward_phase":5,"ustx_until_pox_rejection":8484139029839119000},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":35,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119000,"next_reward_cycle_in":5,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
    });

    const client = new StackingClient({
      address: '',
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    const poxInfo = await client.getPoxInfo();
    expect(poxInfo.contract_id).toBe('ST000000000000000000002AMW42H.pox-3');

    const periodInfo = await client.getPoxOperationInfo();
    if (periodInfo.period !== PoxOperationPeriod.Period3) throw 'expect period 3';
    if (!('pox3' in periodInfo)) throw 'expect .pox3';

    expect(periodInfo.period).toBe('Period3');
    expect(periodInfo.period).toBe(PoxOperationPeriod.Period3);
    expect(periodInfo.pox1.contract_id).toBe('ST000000000000000000002AMW42H.pox');
    expect(periodInfo.pox2.contract_id).toBe('ST000000000000000000002AMW42H.pox-2');
    expect(periodInfo.pox3.contract_id).toBe('ST000000000000000000002AMW42H.pox-3');
    expect(periodInfo.current.contract_id).toBe(poxInfo.contract_id);
  });
});

test('in period 3, pox-3 stacking works', async () => {
  const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
  const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

  const client = new StackingClient({
    address,
    network: STACKS_TESTNET,
    client: { baseUrl: API_URL },
  });

  setApiMocks({
    '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600057529871055,"first_burnchain_block_height":0,"current_burnchain_block_height":217,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005752987105576,"current_cycle":{"id":43,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":44,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500719123388,"stacked_ustx":0,"prepare_phase_start_block_height":219,"blocks_until_prepare_phase":2,"reward_phase_start_block_height":220,"blocks_until_reward_phase":3,"ustx_until_pox_rejection":1485692420695552500},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":43,"reward_cycle_length":5,"rejection_votes_left_required":1485692420695552500,"next_reward_cycle_in":3,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
    '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fefa","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":1}`,
    '/v2/contracts/interface/ST000000000000000000002AMW42H/pox-3': V2_POX_INTERFACE_POX_3,
  });

  const poxOperation = await client.getPoxOperationInfo();
  expect(poxOperation.period).toBe(PoxOperationPeriod.Period3);

  const poxInfo = await client.getPoxInfo();

  const stackingResult = await client.stack({
    amountMicroStx: poxInfo.min_amount_ustx,
    burnBlockHeight: poxInfo.current_burnchain_block_height as number,
    cycles: 12,
    poxAddress,
    privateKey,
  });

  await waitForTx(stackingResult.txid);

  setApiMocks({
    '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd7b11f6c5f4","locked":"0x00000000000000000006a9775dca3800","unlock_height":280,"nonce":2}`,
  });

  const balanceLocked = await client.getAccountBalanceLocked();
  expect(balanceLocked).toBe(BigInt(poxInfo.min_amount_ustx));

  const lastBroadcast = getFetchMockBroadcast();
  expect(
    (deserializeTransaction(lastBroadcast.tx as string).payload as ContractCallPayload).contractName
      .content
  ).toBe('pox-3');
});

describe('stacking eligibility', () => {
  test('eligible', async () => {
    setApiMocks(MOCK_FULL_ACCOUNT);

    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    const cycles = 1;
    const stackingEligibility = await client.canStack({ poxAddress, cycles });

    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[0][0]).toEqual(`${API_URL}/v2/accounts/${address}?proof=0`);
    expect(fetchMock.mock.calls[1][0]).toEqual(`${API_URL}/v2/pox`);
    expect(fetchMock.mock.calls[2][0]).toContain('/pox-3/can-stack-stx');
    expect(stackingEligibility.eligible).toBe(true);
  });

  test('not eligible', async () => {
    setApiMocks(MOCK_EMPTY_ACCOUNT);

    const address = 'ST162GBCTD9ESBF09XC2T63NCX6ZKS42ZPWGXZ6VH';
    const poxAddress = 'mnTdnFyjxRomWaSLp4fNGSa9Gyg9XJo4j4';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    const cycles = 1;
    const stackingEligibility = await client.canStack({ poxAddress, cycles });

    expect(fetchMock.mock.calls.length).toEqual(3);
    expect(fetchMock.mock.calls[0][0]).toEqual(`${API_URL}/v2/accounts/${address}?proof=0`);
    expect(fetchMock.mock.calls[1][0]).toEqual(`${API_URL}/v2/pox`);
    expect(fetchMock.mock.calls[2][0]).toContain('/pox-3/can-stack-stx');
    expect(stackingEligibility.eligible).toBe(false);
    expect(stackingEligibility.reason).toBe('ERR_STACKING_THRESHOLD_NOT_MET');
  });
});

describe('normal stacking', () => {
  test('stack stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fbca","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":4}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x09"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd7b11f6c259","locked":"0x00000000000000000006a9775dca3800","unlock_height":215,"nonce":5}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c6501000000000000000000000000000000290b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b0000000201000000000000000000000000000000000100000000000000000000000000000000"}`,
    });

    status = await client.getStatus();
    expect(status.stacked).toBeTruthy();
  });

  test('stack and extend stx', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0f8e8","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":6}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bdeadb1b","locked":"0x00000000000000000006a979b1d61c00","unlock_height":300,"nonce":7}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c65010000000000000000000000000000003a0b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b0000000201000000000000000000000000000000000100000000000000000000000000000000"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bdeada34","locked":"0x00000000000000000006a979b1d61c00","unlock_height":310,"nonce":8}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f091266697273742d7265776172642d6379636c65010000000000000000000000000000003a0b6c6f636b2d706572696f64010000000000000000000000000000000408706f782d616464720c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e020000000100127265776172642d7365742d696e64657865730b000000040100000000000000000000000000000000010000000000000000000000000000000001000000000000000000000000000000000100000000000000000000000000000000"}`,
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

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0f4ea","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":9}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bdead741","locked":"0x00000000000000000006a979b1d61c00","unlock_height":380,"nonce":10}`,
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
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bb887c8e","locked":"0x00000000000000000006a979b4387600","unlock_height":380,"nonce":11}`,
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

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x09"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fde0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":2}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a9775dca38000c64656c6567617465642d746f051aa8cf5b9a7d1a2a4305f78c92ba50040382484bd408706f782d616464720a0c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e0200000001000d756e74696c2d6275726e2d68740a010000000000000000000000000000008d"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fcd0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":3}`,
    });

    status = await client.getDelegationStatus();
    expect(status.delegated).toBeTruthy();

    const balanceLocked = await client.getAccountBalanceLocked();
    expect(balanceLocked).toBe(0n); // no funds are locked yet, because the pool hasn't (partially) stacked yet
  });

  test('delegate stx without until height', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';

    const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x09"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fde0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":2}`,
    });

    let status = await client.getDelegationStatus();
    expect(status.delegated).toBeFalsy();

    const poxInfo = await client.getPoxInfo();
    const delegationResult = await client.delegateStx({
      delegateTo,
      amountMicroStx: BigInt(poxInfo.min_amount_ustx),
      poxAddress,
      privateKey,
    });
    await waitForTx(delegationResult.txid);

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a9775dca38000c64656c6567617465642d746f051aa8cf5b9a7d1a2a4305f78c92ba50040382484bd408706f782d616464720a0c0000000209686173686279746573020000001405cf52a44bf3e6829b4f8c221cc675355bf83b7d0776657273696f6e0200000001000d756e74696c2d6275726e2d687409"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fcd0","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":3}`,
    });

    status = await client.getDelegationStatus();
    if (!status.delegated) throw Error;
    expect(status.details.until_burn_ht).toBeUndefined();
  });

  test('delegate stack, and delegator stack', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

    const delegatorPrivateKey =
      '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });
    const delegatorClient = new StackingClient({
      address: delegatorAddress,
      network: STACKS_TESTNET,
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0e8fe","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":20}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0fce8","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":2}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d75737478010000000000000000000354bcd8eb0e000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a01000000000000000000000000000001f4"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x09"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x00000000000000000020323596d5d9ee","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":465,"nonce":21}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c65010000000000000000000000000000005b0b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

    stackingStatus = await client.getStatus();
    expect(stackingStatus.stacked).toBeTruthy();

    const balanceLocked = await client.getAccountBalanceLocked();
    expect(balanceLocked).toBeGreaterThan(0n); // now some of the users funds are locked in delegated (partial) stacking
  });

  test('delegate stack, delegator stack, and delegator extend stack', async () => {
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

    const delegatorPrivateKey =
      '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const delegatorAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const delegatorPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });
    const delegatorClient = new StackingClient({
      address: delegatorAddress,
      network: STACKS_TESTNET,
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0de4b","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":26}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0e962","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":8}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d75737478010000000000000000000354bcd8eb0e000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000000229"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x09"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000680b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x00000000000000000020323596d5cce6","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":530,"nonce":27}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0e3ba","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":9}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x00000000000000000020323596d5cce6","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":540,"nonce":27}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000680b6c6f636b2d706572696f64010000000000000000000000000000000408706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
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

    const client = new StackingClient({
      address,
      network: STACKS_TESTNET,
      client: { baseUrl: API_URL },
    });
    const delegatorClient = new StackingClient({
      address: delegatorAddress,
      network: STACKS_TESTNET,
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fa2c","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":5}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0f65f","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":6}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d757374780100000000000000000006a979b1d61c000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000000131"}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x09"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x00000000000000000020323596d5eb1c","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":270,"nonce":6}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0f4be","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":7}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000340b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
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
      ...MOCK_POX_3_REGTEST,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bdeadd1c","locked":"0x00000000000000000006a979b1d61c00","unlock_height":270,"nonce":6}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000340b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
    });

    stackingStatus = await client.getStatus();
    if (!stackingStatus.stacked) throw Error;

    balanceLocked = await client.getAccountBalanceLocked();
    expect(balanceLocked).toBe(fullAmount);
  });

  test('delegator stacks for multiple stackers in a pool (compatible with pox-1)', async () => {
    // Prerequisites:
    // * Assumes no other stackers are stacking for these reward cycles
    // Step-by-step:
    // * Two stackers (A and B) delegate to a pool
    // * The pool stacks for both stackers (partially)
    // * The pool commits a total stacking amount (covering all of its stackers)
    //   * This is required for a pools pox-address to be "commited" into the reward-set

    const client = { baseUrl: API_URL };

    const stackerAKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const stackerAAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const clientA = new StackingClient({
      address: stackerAAddress,
      network: STACKS_TESTNET,
      client,
    });

    const stackerBKey = 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01';
    const stackerBAddress = 'ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR';
    const clientB = new StackingClient({
      address: stackerBAddress,
      network: STACKS_TESTNET,
      client,
    });

    const poolPrivateKey = '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const poolAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const poolPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';
    const clientPool = new StackingClient({
      address: poolAddress,
      network: STACKS_TESTNET,
      client,
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600058823055055,"first_burnchain_block_height":0,"current_burnchain_block_height":346,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005882305505576,"current_cycle":{"id":68,"min_threshold_ustx":1875190000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":69,"min_threshold_ustx":1875190000000000,"min_increment_ustx":7500735288188,"stacked_ustx":0,"prepare_phase_start_block_height":349,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":350,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":16557369452995301000},"min_amount_ustx":1875190000000000,"prepare_cycle_length":1,"reward_cycle_id":68,"reward_cycle_length":5,"rejection_votes_left_required":16557369452995301000,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0f5b2","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":9}`,
      '/v2/accounts/ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR?proof=0': `{"balance":"0x0000000000000000002386f26fc0fc96","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":3}`,
    });

    let poxInfo = await clientPool.getPoxInfo();
    const START_BLOCK_HEIGHT = poxInfo.current_burnchain_block_height as number;
    const DELEGATE_UNTIL = START_BLOCK_HEIGHT + 25;
    const FULL_AMOUNT = BigInt(poxInfo.min_amount_ustx);
    const HALF_AMOUNT = FULL_AMOUNT / 2n;

    // Stacker A delegates half the funds
    const delegateA = await clientA.delegateStx({
      delegateTo: poolAddress,
      amountMicroStx: HALF_AMOUNT,
      untilBurnBlockHeight: DELEGATE_UNTIL,
      poxAddress: poolPoxAddress,
      privateKey: stackerAKey,
    });

    // Stacker B delegates the other half of the funds
    const delegateB = await clientA.delegateStx({
      delegateTo: poolAddress,
      amountMicroStx: HALF_AMOUNT,
      untilBurnBlockHeight: DELEGATE_UNTIL,
      poxAddress: poolPoxAddress,
      privateKey: stackerBKey,
    });

    await waitForTx(delegateA.txid);
    await waitForTx(delegateB.txid);

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600058843261055,"first_burnchain_block_height":0,"current_burnchain_block_height":347,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005884326105576,"current_cycle":{"id":69,"min_threshold_ustx":1875190000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":70,"min_threshold_ustx":1875190000000000,"min_increment_ustx":7500735540763,"stacked_ustx":0,"prepare_phase_start_block_height":349,"blocks_until_prepare_phase":2,"reward_phase_start_block_height":350,"blocks_until_reward_phase":3,"ustx_until_pox_rejection":2381345599039397400},"min_amount_ustx":1875190000000000,"prepare_cycle_length":1,"reward_cycle_id":69,"reward_cycle_length":5,"rejection_votes_left_required":2381345599039397400,"next_reward_cycle_in":3,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-delegation-info': `{"okay":true,"result":"0x0a0c000000040b616d6f756e742d75737478010000000000000000000354bcd8eb0e000c64656c6567617465642d746f051a43596b5386f466863e25658ddf94bd0fadab004808706f782d616464720a0c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e0200000001000d756e74696c2d6275726e2d68740a0100000000000000000000000000000173"}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0e72b","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":14}`,
    });

    const delegationStatusA = await clientA.getDelegationStatus();
    expect(delegationStatusA.delegated).toBeTruthy();

    const delegationStatusB = await clientB.getDelegationStatus();
    expect(delegationStatusB.delegated).toBeTruthy();

    poxInfo = await clientPool.getPoxInfo();

    // Manual nonce setting is required for multiple transactions in the same block
    let noncePool = await fetchNonce({ address: poolAddress, client });

    // Pool stacks for stacker A
    const stackAPool = await clientPool.delegateStackStx({
      stacker: stackerAAddress,
      amountMicroStx: HALF_AMOUNT,
      burnBlockHeight: poxInfo.current_burnchain_block_height as number,
      cycles: 2,
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      nonce: noncePool++,
    });

    // Pool stacks for stacker B
    const stackBPool = await clientPool.delegateStackStx({
      stacker: stackerBAddress,
      amountMicroStx: HALF_AMOUNT,
      burnBlockHeight: poxInfo.current_burnchain_block_height as number,
      cycles: 2,
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      nonce: noncePool++,
    });

    await waitForTx(stackAPool.txid);
    await waitForTx(stackBPool.txid);

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000460b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x00000000000000000020323596d5e63a","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":360,"nonce":10}`,
      '/v2/accounts/ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR?proof=0': `{"balance":"0x00000000000000000020323596d5ed1e","locked":"0x0000000000000000000354bcd8eb0e00","unlock_height":360,"nonce":4}`,
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0e22b","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":16}`,
    });

    // Balances are now locked for stackers (only partially stacked at this point)
    const stackingStatusA = await clientA.getStatus();
    if (!stackingStatusA.stacked) throw Error;

    const stackingStatusB = await clientB.getStatus();
    if (!stackingStatusB.stacked) throw Error;

    expect(
      stackingStatusA.details.first_reward_cycle === stackingStatusB.details.first_reward_cycle
    ).toBeTruthy();

    const balanceLockedA = await clientA.getAccountBalanceLocked();
    expect(balanceLockedA).toBe(HALF_AMOUNT);

    const balanceLockedB = await clientB.getAccountBalanceLocked();
    expect(balanceLockedB).toBe(HALF_AMOUNT);

    const commitPool = await clientPool.stackAggregationCommit({
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      rewardCycle: stackingStatusA.details.first_reward_cycle,
    });

    await waitForTx(commitPool.txid);
    await waitForCycle(stackingStatusA.details.first_reward_cycle);

    setApiMocks({
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-reward-set-pox-address': `{"okay":true,"result":"0x0a0c0000000308706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e02000000010007737461636b6572090a746f74616c2d757374780100000000000000000006a979b1d61c00"}`,
    });

    const rewardSet = await clientPool.getRewardSet({
      contractId: poxInfo.contract_id,
      rewardCyleId: stackingStatusA.details.first_reward_cycle,
      rewardSetIndex: 0, // first and only entry in reward set
    });
    expect(rewardSet).toBeDefined();
    expect(rewardSet?.total_ustx).toBe(FULL_AMOUNT);
    expect(rewardSet?.pox_address.version[0]).toEqual(decodeBtcAddress(poolPoxAddress).version);
    expect(rewardSet?.pox_address.hashbytes).toEqual(decodeBtcAddressBytes(poolPoxAddress).data);
  });

  test('delegator stacks for multiple stackers in a pool, then increases commitment (requires >= pox-2)', async () => {
    // Prerequisites:
    // * Assumes no other stackers are stacking for these reward cycles
    // Step-by-step:
    // * Two stackers (A and B) delegate to a pool
    //   * Both provide more than half the required funds
    // * The pool stacks some of the funds for both stackers (partially)
    //   * The pool didn't realize how much it could stack and only stacks the minimum amount (even though more was delegated)
    // * The pool commits a total stacking amount (not yet covering the full amount of its stackers)
    // * The pool realizes the mistake and increases the amount to all of its stackers' funds
    //   * This will only work if the reward cycle anchor block hasn't been reached yet!

    const clientOpts = { baseUrl: API_URL };

    const stackerAKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const stackerAAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const clientA = new StackingClient({
      address: stackerAAddress,
      network: STACKS_TESTNET,
      client: clientOpts,
    });

    const stackerBKey = 'c71700b07d520a8c9731e4d0f095aa6efb91e16e25fb27ce2b72e7b698f8127a01';
    const stackerBAddress = 'ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR';
    const clientB = new StackingClient({
      address: stackerBAddress,
      network: STACKS_TESTNET,
      client: clientOpts,
    });

    const poolPrivateKey = '21d43d2ae0da1d9d04cfcaac7d397a33733881081f0b2cd038062cf0ccbb752601';
    const poolAddress = 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y';
    const poolPoxAddress = '1797Pp1o8A7a8X8Qs7ejXtYyw8gbecFK2b';
    const clientPool = new StackingClient({
      address: poolAddress,
      network: STACKS_TESTNET,
      client: clientOpts,
    });

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":118,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905576,"current_cycle":{"id":23,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":24,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":119,"blocks_until_prepare_phase":1,"reward_phase_start_block_height":120,"blocks_until_reward_phase":2,"ustx_until_pox_rejection":8484139029839119000},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":23,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119000,"next_reward_cycle_in":2,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
      // Stacker A
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc10000","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`,
      // Stacker B
      '/v2/accounts/ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR?proof=0': `{"balance":"0x0000000000000000002386f26fc10000","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`,
    });

    let poxInfo = await clientPool.getPoxInfo();
    const START_BLOCK_HEIGHT = poxInfo.current_burnchain_block_height as number;
    const DELEGATE_UNTIL = START_BLOCK_HEIGHT + 25;
    const FULL_AMOUNT = BigInt(poxInfo.min_amount_ustx); // full amount required for a reward set
    const HALF_AMOUNT = FULL_AMOUNT / 2n;
    const AMOUNT_75 = BigInt(Number(FULL_AMOUNT) * 0.75); // 3/4 of the required funds

    // Stacker A delegates some funds
    const delegateA = await clientA.delegateStx({
      delegateTo: poolAddress,
      amountMicroStx: AMOUNT_75,
      untilBurnBlockHeight: DELEGATE_UNTIL,
      poxAddress: poolPoxAddress,
      privateKey: stackerAKey,
    });

    // Stacker B delegates some funds
    const delegateB = await clientA.delegateStx({
      delegateTo: poolAddress,
      amountMicroStx: AMOUNT_75,
      untilBurnBlockHeight: DELEGATE_UNTIL,
      poxAddress: poolPoxAddress,
      privateKey: stackerBKey,
    });

    await waitForTx(delegateA.txid);
    await waitForTx(delegateB.txid);

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":120,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905576,"current_cycle":{"id":23,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":24,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":124,"blocks_until_prepare_phase":4,"reward_phase_start_block_height":125,"blocks_until_reward_phase":5,"ustx_until_pox_rejection":8484139029839119000},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":23,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119000,"next_reward_cycle_in":5,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
      // Pool
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc10000","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`,
    });

    poxInfo = await clientPool.getPoxInfo();

    // Manual nonce setting is required for multiple transactions in the same block
    let noncePool = await fetchNonce({ address: poolAddress, client: clientOpts });

    // Pool stacks for stacker A (stacks all 3/4)
    const stackAPool = await clientPool.delegateStackStx({
      stacker: stackerAAddress,
      amountMicroStx: AMOUNT_75,
      burnBlockHeight: poxInfo.current_burnchain_block_height as number,
      cycles: 2,
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      nonce: noncePool++,
    });

    // Pool stacks for stacker B (stacks only 1/2)
    const stackBPool = await clientPool.delegateStackStx({
      stacker: stackerBAddress,
      amountMicroStx: HALF_AMOUNT,
      burnBlockHeight: poxInfo.current_burnchain_block_height as number,
      cycles: 2,
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      nonce: noncePool++,
    });

    await waitForTx(stackAPool.txid);
    await waitForTx(stackBPool.txid);

    setApiMocks({
      ...MOCK_POX_3_REGTEST,
      '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-3","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":121,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905576,"current_cycle":{"id":24,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":25,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":124,"blocks_until_prepare_phase":3,"reward_phase_start_block_height":125,"blocks_until_reward_phase":4,"ustx_until_pox_rejection":8484139029839119000},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":24,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119000,"next_reward_cycle_in":4,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":107,"first_reward_cycle_id":22},{"contract_id":"ST000000000000000000002AMW42H.pox-3","activation_burnchain_block_height":111,"first_reward_cycle_id":23}]}`,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x0a0c000000050c64656c6567617465642d746f0a051a43596b5386f466863e25658ddf94bd0fadab00481266697273742d7265776172642d6379636c6501000000000000000000000000000000190b6c6f636b2d706572696f64010000000000000000000000000000000208706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e020000000100127265776172642d7365742d696e64657865730b00000000"}`,
      // Stacker A
      '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001e87d8e96954f0","locked":"0x00000000000000000004ff198657aa00","unlock_height":135,"nonce":1}`,
      // Stacker B
      '/v2/accounts/ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR?proof=0': `{"balance":"0x000000000000000000203236c0dbe2f0","locked":"0x0000000000000000000354bbaee51c00","unlock_height":135,"nonce":1}`,
      // Pool
      '/v2/accounts/ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y?proof=0': `{"balance":"0x0000000000000000002386f26fc0fdb6","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":2}`,
    });

    // Balances are now locked for stackers (only partially stacked at this point)
    const stackingStatusA = await clientA.getStatus();
    if (!stackingStatusA.stacked) throw Error;

    const stackingStatusB = await clientB.getStatus();
    if (!stackingStatusB.stacked) throw Error;

    expect(
      stackingStatusA.details.first_reward_cycle === stackingStatusB.details.first_reward_cycle
    ).toBeTruthy();

    const balanceLockedA = await clientA.getAccountBalanceLocked();
    expect(balanceLockedA).toBe(AMOUNT_75);

    const balanceLockedB = await clientB.getAccountBalanceLocked();
    expect(balanceLockedB).toBe(HALF_AMOUNT);

    // In this test the pool uses the new .stackAggregationCommitIndexed (PoX-2)
    // Which is basically the same as .stackAggregationCommit, but the tx will
    // return the commits index in the reward set
    const commitIndexed = await clientPool.stackAggregationCommitIndexed({
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      rewardCycle: stackingStatusA.details.first_reward_cycle,
    });

    await waitForTx(commitIndexed.txid);

    // Oops, the pool realized they didn't stack all delegated funds for stacker B
    // Pool increases for stacker B (to all 3/4)
    const increaseBPool = await clientPool.delegateStackIncrease({
      stacker: stackerBAddress,
      increaseBy: AMOUNT_75 - HALF_AMOUNT, // increase by the missing amount
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
    });

    await waitForTx(increaseBPool.txid);

    const commitIncrease = await clientPool.stackAggregationIncrease({
      poxAddress: poolPoxAddress,
      privateKey: poolPrivateKey,
      rewardCycle: stackingStatusA.details.first_reward_cycle,
      rewardIndex: 0, // would now also be returned by the commitIndexed tx
    });

    await waitForTx(commitIncrease.txid);
    // to be included, the latest commit (increase) needs to be mined before the reward cycles' anchor block
    await waitForCycle(stackingStatusA.details.first_reward_cycle);

    setApiMocks({
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-reward-set-pox-address': `{"okay":true,"result":"0x0a0c0000000308706f782d616464720c0000000209686173686279746573020000001443596b5386f466863e25658ddf94bd0fadab00480776657273696f6e02000000010007737461636b6572090a746f74616c2d757374780100000000000000000009fe330caf5400"}`,
    });

    const rewardSet = await clientPool.getRewardSet({
      contractId: poxInfo.contract_id,
      rewardCyleId: stackingStatusA.details.first_reward_cycle,
      rewardSetIndex: 0,
    });
    expect(rewardSet).toBeDefined();
    expect(rewardSet?.total_ustx).toBe(AMOUNT_75 * 2n); // 1.5x the FULL_AMOUNT (aka everything the stackers stacked together)
    expect(rewardSet?.pox_address.version[0]).toEqual(decodeBtcAddress(poolPoxAddress).version);
    expect(rewardSet?.pox_address.hashbytes).toEqual(decodeBtcAddressBytes(poolPoxAddress).data);
  });
});

describe('btc addresses', () => {
  test.each(BTC_ADDRESS_CASES)(
    'stack with btc address',
    async ({ address: btcAddress, expectedHash, expectedVersion, mockedResult }) => {
      const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
      const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

      const client = new StackingClient({
        address,
        network: STACKS_TESTNET,
        client: { baseUrl: API_URL },
      });

      setApiMocks({
        ...MOCK_POX_3_REGTEST,
        '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fc0fb60","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":4}`,
        '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"0x09"}`,
      });

      const poxInfo = await client.getPoxInfo();
      const stackingResult = await client.stack({
        amountMicroStx: BigInt(poxInfo.min_amount_ustx),
        burnBlockHeight: (poxInfo.current_burnchain_block_height as number) + 1,
        poxAddress: btcAddress,
        cycles: 1,
        privateKey,
      });
      await waitForTx(stackingResult.txid);

      setApiMocks({
        ...MOCK_POX_3_REGTEST,
        '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000001cdd78bdeaddbd","locked":"0x00000000000000000006a979b1d61c00","unlock_height":260,"nonce":5}`,
        '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-3/get-stacker-info': `{"okay":true,"result":"${mockedResult}"}`,
      });

      const stackingStatus = await client.getStatus();
      if (!stackingStatus.stacked) throw Error;

      expect(stackingStatus.details.pox_address.hashbytes).toEqual(hexToBytes(expectedHash));
      expect(stackingStatus.details.pox_address.version).toHaveLength(1);
      expect(stackingStatus.details.pox_address.version[0]).toEqual(expectedVersion);
    }
  );
});
