import { testables } from '../src/cli';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { CLI_CONFIG_TYPE } from '../src/argparse';

import * as fixtures from './fixtures/cli.fixture';
import inquirer from 'inquirer';
import { ClarityAbi } from '@stacks/transactions';
import { readFileSync } from 'fs';
import path from 'path';
import fetchMock from 'jest-fetch-mock';
import {
  makekeychainTests,
  keyInfoTests,
  MakeKeychainResult,
  WalletKeyInfoResult,
} from './derivation-path/keychain';

const TEST_ABI: ClarityAbi = JSON.parse(
  readFileSync(path.join(__dirname, './abi/test-abi.json')).toString()
);
const TEST_FEE_ESTIMATE = JSON.parse(
  readFileSync(path.join(__dirname, './fee-estimate/test-fee-estimate.json')).toString()
);
jest.mock('inquirer');

const {
  addressConvert,
  contractFunctionCall,
  makeKeychain,
  getStacksWalletKey,
  preorder,
  register,
  canStack,
} = testables as any;

const mainnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, false),
  {} as CLI_NETWORK_OPTS
);

const testnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, true),
  {} as CLI_NETWORK_OPTS
);

describe('convert_address', () => {
  test.each(fixtures.convertAddress)('%p - testnet: %p', async (input, testnet, expectedResult) => {
    const network = testnet ? testnetNetwork : mainnetNetwork;
    const result = await addressConvert(network, [input]);
    expect(JSON.parse(result)).toEqual(expectedResult);
  });
});

describe('Contract function call', () => {
  test('Should accept string-ascii clarity type argument', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-string-ascii-argument';
    const fee = 200;
    const nonce = 0;
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey];
    const contractInputArg = { currency: 'USD' };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg);

    fetchMock.once(JSON.stringify(TEST_ABI)).once('success');

    const txid = '0x6c764e276b500babdac6cec159667f4b68938d31eee82419473a418222af7d5d';
    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });

  test('Should accept string-utf8 clarity type argument', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-string-utf8-argument';
    const fee = 210;
    const nonce = 1;
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey];
    const contractInputArg = { msg: 'plain text' };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg);

    fetchMock.once(JSON.stringify(TEST_ABI)).once('success');

    const txid = '0x97f41dfa44a5833acd9ca30ffe31d7137623c0e31a5c6467daeed8e61a03f51c';
    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });

  test('Should accept optional clarity type argument', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-optional-argument';
    const fee = 220;
    const nonce = 2;
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey];
    const contractInputArg = { optional: 'optional string-utf8 string' };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg);

    fetchMock.once(JSON.stringify(TEST_ABI)).once('success');

    const txid = '0x5fc468f21345c5ecaf1c007fce9630d9a79ec1945ed8652cc3c42fb542e35fe2';
    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });

  test('Should accept primitive clarity type arguments', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-primitive-argument';
    const fee = 230;
    const nonce = 3;
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey];
    const contractInputArg = {
      amount: 1000,
      address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      exists: false,
    };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg);

    fetchMock.once(JSON.stringify(TEST_ABI)).once('success');

    const txid = '0x94b1cfab79555b8c6725f19e4fcd6268934d905578a3e8ef7a1e542b931d3676';
    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });

  test('Should accept buffer clarity type argument', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-buffer-argument';
    const fee = 240;
    const nonce = 4;
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey];
    const contractInputArg = {
      bufferArg: 'string buffer',
    };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg);

    fetchMock.once(JSON.stringify(TEST_ABI)).once('success');

    const txid = '0x6b6cd5bfb44c46a68090f0c5f659e9cc02518eafab67b0b740e1e77a55bbf284';
    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });
});

describe('Keychain custom derivation path', () => {
  test.each(makekeychainTests)(
    'Make keychain using custom derivation path %#',
    async (derivationPath: string, keyChainResult: MakeKeychainResult) => {
      const encrypted =
        'vim+XrRNSm+SqSn0MyWNEi/e+UK5kX8WGCLE/sevT6srZG+quzpp911sWP0CcvsExCH1M4DgOfOldMitLdkq1b6rApDwtAcOWdAqiaBk37M=';
      const args = [encrypted, derivationPath];

      // Mock TTY
      process.stdin.isTTY = true;
      process.env.password = 'supersecret';

      const keyChain = await makeKeychain(testnetNetwork, args);
      const result = JSON.parse(keyChain);
      expect(result).toEqual(keyChainResult);
      // Unmock TTY
      process.stdin.isTTY = false;
      process.env.password = undefined;
    }
  );

  test.each(keyInfoTests)(
    'Make keychain using custom derivation path %#',
    async (derivationPath: string, walletInfoResult: WalletKeyInfoResult) => {
      const encrypted =
        'vim+XrRNSm+SqSn0MyWNEi/e+UK5kX8WGCLE/sevT6srZG+quzpp911sWP0CcvsExCH1M4DgOfOldMitLdkq1b6rApDwtAcOWdAqiaBk37M=';
      const args = [encrypted, derivationPath];

      // Mock TTY
      process.stdin.isTTY = true;
      process.env.password = 'supersecret';

      const walletKey = await getStacksWalletKey(testnetNetwork, args);
      const result = JSON.parse(walletKey);
      expect(result).toEqual([walletInfoResult]);
      // Unmock TTY
      process.stdin.isTTY = false;
      process.env.password = undefined;
    }
  );
});

describe('BNS', () => {
  test('buildRegisterNameTx', async () => {
    const fullyQualifiedName = 'test.id';
    const ownerKey = '0d146cf7289dd0b6f41385b0dbc733167c5dffc6534c59cafd63a615f59095d8';
    const salt = 'salt';
    const zonefile = 'zonefile';

    const args = [fullyQualifiedName, ownerKey, salt, zonefile];

    const mockedResponse = JSON.stringify(TEST_FEE_ESTIMATE);

    fetchMock.mockOnce(mockedResponse);
    fetchMock.mockOnce(JSON.stringify({ nonce: 1000 }));
    fetchMock.mockOnce(JSON.stringify('success'));

    const txResult = await register(testnetNetwork, args);

    expect(txResult.txid).toEqual('0xsuccess');
  });

  test('buildPreorderNameTx', async () => {
    const fullyQualifiedName = 'test.id';
    const privateKey = '0d146cf7289dd0b6f41385b0dbc733167c5dffc6534c59cafd63a615f59095d8';
    const salt = 'salt';
    const stxToBurn = '1000';

    const args = [fullyQualifiedName, privateKey, salt, stxToBurn];

    const mockedResponse = JSON.stringify(TEST_FEE_ESTIMATE);

    fetchMock.mockOnce(mockedResponse);
    fetchMock.mockOnce(JSON.stringify({ nonce: 1000 }));
    fetchMock.mockOnce(JSON.stringify('success'));

    const txResult = await preorder(testnetNetwork, args);

    expect(txResult.txid).toEqual('0xsuccess');
  });
});

test('can_stack', async () => {
  fetchMock.resetMocks();
  fetchMock.mockOnce(
    '{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":827381723155441,"first_burnchain_block_height":2000000,"prepare_phase_block_length":50,"reward_phase_block_length":1000,"reward_slots":2000,"rejection_fraction":12,"total_liquid_supply_ustx":41369086157772050,"current_cycle":{"id":269,"min_threshold_ustx":5180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":270,"min_threshold_ustx":5180000000000,"min_increment_ustx":5171135769721,"stacked_ustx":5600000000000,"prepare_phase_start_block_height":2283450,"blocks_until_prepare_phase":146,"reward_phase_start_block_height":2283500,"blocks_until_reward_phase":196,"ustx_until_pox_rejection":4964290338932640},"min_amount_ustx":5180000000000,"prepare_cycle_length":50,"reward_cycle_id":269,"reward_cycle_length":1050,"rejection_votes_left_required":4964290338932640,"next_reward_cycle_in":196}'
  );
  fetchMock.mockOnce(
    '{ "balance": "0x0000000000000000000005a74678d000", "locked": "0x00000000000000000000000000000000", "unlock_height": 0, "nonce": 0 }'
  );
  fetchMock.mockOnce(
    '{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":827381723155441,"first_burnchain_block_height":2000000,"prepare_phase_block_length":50,"reward_phase_block_length":1000,"reward_slots":2000,"rejection_fraction":12,"total_liquid_supply_ustx":41369086157772050,"current_cycle":{"id":269,"min_threshold_ustx":5180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":270,"min_threshold_ustx":5180000000000,"min_increment_ustx":5171135769721,"stacked_ustx":5600000000000,"prepare_phase_start_block_height":2283450,"blocks_until_prepare_phase":146,"reward_phase_start_block_height":2283500,"blocks_until_reward_phase":196,"ustx_until_pox_rejection":4964290338932640},"min_amount_ustx":5180000000000,"prepare_cycle_length":50,"reward_cycle_id":269,"reward_cycle_length":1050,"rejection_votes_left_required":4964290338932640,"next_reward_cycle_in":196}'
  );
  fetchMock.mockOnce('{"okay":true,"result":"0x0703"}');
  fetchMock.mockOnce('{"eligible":true}');

  const params =
    '6216000000000 10 mqkccNX5h7Xy1YUku3X2fCFCC54x6HEiHk ST3VJVZ265JZMG1N61YE3EQ7GNTQHF6PXP0E7YACV';
  const response = await canStack(testnetNetwork, params.split(' '));
  expect(response.eligible).toBe(true);

  expect(fetchMock.mock.calls).toHaveLength(4);
  expect(fetchMock.mock.calls[3][0]).toContain('/pox/can-stack-stx');
  expect(fetchMock.mock.calls[3][1]?.body).toBe(
    '{"sender":"ST3VJVZ265JZMG1N61YE3EQ7GNTQHF6PXP0E7YACV","arguments":["0x0c000000020968617368627974657302000000147046a658021260485e1ba9eb6c3e4c26b60953290776657273696f6e020000000100","0x010000000000000000000005a74678d000","0x010000000000000000000000000000010d","0x010000000000000000000000000000000a"]}'
  );
});
