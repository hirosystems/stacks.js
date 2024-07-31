import { CLI_CONFIG_TYPE } from '../src/argparse';
import { CLIMain, testables } from '../src/cli';
import { CLINetworkAdapter, CLI_NETWORK_OPTS, getNetwork } from '../src/network';

import {
  Cl,
  ClarityAbi,
  publicKeyFromSignatureVrs,
  randomBytes,
  signWithKey,
  verifySignature,
} from '@stacks/transactions';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import inquirer from 'inquirer';
import fetchMock from 'jest-fetch-mock';
import path from 'path';
import { SubdomainOp, subdomainOpToZFPieces } from '../src/utils';
import {
  keyInfoTests,
  MakeKeychainResult,
  makekeychainTestsMainnet,
  makekeychainTestsTestnet,
  WalletKeyInfoResult,
} from './derivation-path/keychain';
import * as fixtures from './fixtures/cli.fixture';
import { bytesToHex } from '@stacks/common';

const TEST_ABI: ClarityAbi = JSON.parse(
  readFileSync(path.join(__dirname, './abi/test-abi.json')).toString()
);
const TEST_FEE_ESTIMATE = JSON.parse(
  readFileSync(path.join(__dirname, './fee-estimate/test-fee-estimate.json')).toString()
);
jest.mock('inquirer');

const {
  addressConvert,
  decodeCV,
  canStack,
  contractFunctionCall,
  getStacksWalletKey,
  makeKeychain,
  migrateSubdomains,
  preorder,
  register,
} = testables as any;

const mainnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, false),
  {} as CLI_NETWORK_OPTS
);

const testnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, true),
  {} as CLI_NETWORK_OPTS
);

describe('decode_cv', () => {
  test('Should decode from hex arg', async () => {
    const result = await decodeCV(mainnetNetwork, [
      '0x050011deadbeef11ababffff11deadbeef11ababffff',
    ]);
    expect(result).toEqual('S08XXBDYXW8TQAZZZW8XXBDYXW8TQAZZZZ88551S');
  });

  test('Should decode from hex to json', async () => {
    const result = await decodeCV(mainnetNetwork, [
      '0x050011deadbeef11ababffff11deadbeef11ababffff',
      'json',
    ]);
    expect(result).toEqual(
      '{"type":"principal","value":"S08XXBDYXW8TQAZZZW8XXBDYXW8TQAZZZZ88551S"}'
    );
  });

  test('Should decode from hex to repr', async () => {
    const list = Cl.list([1, 2, 3].map(Cl.int));
    const serialized = bytesToHex(Cl.serialize(list));
    const result = await decodeCV(mainnetNetwork, [serialized, 'repr']);
    expect(result).toEqual('(list 1 2 3)');
  });

  test('Should decode from hex to pretty print', async () => {
    const list = Cl.list([1, 2, 3].map(Cl.int));
    const serialized = bytesToHex(Cl.serialize(list));
    const result = await decodeCV(mainnetNetwork, [serialized, 'pretty']);
    expect(result).toEqual('(list\n  1\n  2\n  3\n)');
  });
});

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

    const txid = '0x6c764e276b500babdac6cec159667f4b68938d31eee82419473a418222af7d5d';
    fetchMock.once(JSON.stringify(TEST_ABI)).once(txid);

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

    const txid = '0x97f41dfa44a5833acd9ca30ffe31d7137623c0e31a5c6467daeed8e61a03f51c';
    fetchMock.once(JSON.stringify(TEST_ABI)).once(txid);

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

    const txid = '0x5fc468f21345c5ecaf1c007fce9630d9a79ec1945ed8652cc3c42fb542e35fe2';
    fetchMock.once(JSON.stringify(TEST_ABI)).once(txid);

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

    const txid = '0x94b1cfab79555b8c6725f19e4fcd6268934d905578a3e8ef7a1e542b931d3676';
    fetchMock.once(JSON.stringify(TEST_ABI)).once(txid);

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

    const txid = '0x6b6cd5bfb44c46a68090f0c5f659e9cc02518eafab67b0b740e1e77a55bbf284';
    fetchMock.once(JSON.stringify(TEST_ABI)).once(txid);

    const result = await contractFunctionCall(testnetNetwork, args);

    expect(result.txid).toEqual(txid);
  });
});

describe('Keychain custom derivation path', () => {
  test.each(makekeychainTestsMainnet)(
    'Make keychain using custom derivation path %#',
    async (derivationPath: string, keyChainResult: MakeKeychainResult) => {
      const encrypted =
        'vim+XrRNSm+SqSn0MyWNEi/e+UK5kX8WGCLE/sevT6srZG+quzpp911sWP0CcvsExCH1M4DgOfOldMitLdkq1b6rApDwtAcOWdAqiaBk37M=';
      const args = [encrypted, derivationPath];

      // Mock TTY
      process.stdin.isTTY = true;
      process.env.password = 'supersecret';

      const keyChain = await makeKeychain(mainnetNetwork, args);
      const result = JSON.parse(keyChain);
      expect(result).toEqual(keyChainResult);
      // Unmock TTY
      process.stdin.isTTY = false;
      process.env.password = undefined;
    }
  );

  test.each(makekeychainTestsTestnet)(
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
    const randomTxid = bytesToHex(randomBytes());

    fetchMock.mockOnce(mockedResponse);
    fetchMock.mockRejectOnce();
    fetchMock.mockOnce(JSON.stringify({ nonce: 1000 }));
    fetchMock.mockOnce(JSON.stringify(randomTxid));

    const txResult = await register(testnetNetwork, args);

    expect(txResult.txid).toEqual(`0x${randomTxid}`);
  });

  test('buildPreorderNameTx', async () => {
    const fullyQualifiedName = 'test.id';
    const privateKey = '0d146cf7289dd0b6f41385b0dbc733167c5dffc6534c59cafd63a615f59095d8';
    const salt = 'salt';
    const stxToBurn = '1000';

    const args = [fullyQualifiedName, privateKey, salt, stxToBurn];

    const mockedResponse = JSON.stringify(TEST_FEE_ESTIMATE);
    const randomTxid = bytesToHex(randomBytes());

    fetchMock.mockOnce(mockedResponse);
    fetchMock.mockRejectOnce();
    fetchMock.mockOnce(JSON.stringify({ nonce: 1000 }));
    fetchMock.mockOnce(JSON.stringify(randomTxid));

    const txResult = await preorder(testnetNetwork, args);

    expect(txResult.txid).toEqual(`0x${randomTxid}`);
  });
});

describe('Subdomain Migration', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // Consider test scenarios for subdomain migration
  const subDomainTestData: [
    string,
    string,
    string,
    { txid: string; error: string | null; status: number } | string,
    boolean,
  ][] = [
    [
      'sound idle panel often situate develop unit text design antenna vendor screen opinion balcony share trigger accuse scatter visa uniform brass update opinion media',
      'test1.id.stx', // Subdomain to be migrated: success
      'ST30RZ44NTH2D95M1HSWVMM8VVHSAFY71VCERJQM5', // Owner will match
      { txid: 'success', error: null, status: 200 }, // expected output, successfully migrated
      true,
    ],
    [
      'sound idle panel often situate develop unit text design antenna vendor screen opinion balcony share trigger accuse scatter visa uniform brass update opinion media',
      'test2.id.stx', // Subdomain to be migrated
      'ST3Q2T3380WE1K5PW72R6R76Q8HRPEK8HR02W6V1M', // Owner mismatch
      'No subdomains found or selected. Canceling...', // expected output, not migrated due to owner mismatch
      false,
    ],
  ];

  // Perform test on subdomain migration command
  test.each(subDomainTestData)(
    'Transfer subdomains to wallet-key addresses that correspond to all data-key addresses',
    async (mnemonic, subdomain, owner, expected, sendsTransferRequest) => {
      const args = [mnemonic];
      // Mock gaia hub response during restore wallet
      const mockGaiaHubInfo = JSON.stringify({
        read_url_prefix: 'https://gaia.blockstack.org/hub/',
        challenge_text: '["gaiahub","0","gaia-0","blockstack_storage_please_sign"]',
        latest_auth_version: 'v1',
      });

      fetchMock
        .once(mockGaiaHubInfo)
        .once('not found', { status: 404 }) // wallet-config
        .once('not found', { status: 404 }) // wallet-config
        .once(JSON.stringify({ names: [] })) // don't find names on compressed data-key address
        .once(JSON.stringify({ names: [subdomain] })) // find names on compressed data-key address
        .once(JSON.stringify({ names: ['test3.id.stx', 'test4.id.stx'] })) // find subdomains at wallet-key address (migration target)
        .once(
          JSON.stringify({
            address: owner,
            blockchain: 'stacks',
            last_txid: '0x0db9d08ee00bff3cfaeb8c881a1d6391ae974cd8e9143ecb4b60eb1ceb57fbc9',
            resolver: 'https://registrar.stacks.co',
            status: 'registered_subdomain',
            zonefile:
              '$ORIGIN test1.id.stx\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://gaia.blockstack.org/hub/12imq5x4FdqMJVdLAsaRnWTe662ddyWJRT/profile.json"\n\n',
            zonefile_hash: '4f1f4fdd335e66b9798e0b86cf337d7a',
          })
        );
      if (typeof expected !== 'string') {
        fetchMock.once(JSON.stringify(expected), { status: expected.status });
      }

      // Mock the user input as yes to migrate the subdomain
      // @ts-ignore
      inquirer.prompt = jest.fn().mockResolvedValue({ [subdomain.replaceAll('.', '_')]: true });

      const output = await migrateSubdomains(testnetNetwork, args);

      expect(JSON.parse(output)).toEqual(expected);

      if (sendsTransferRequest) {
        // transfer request `subdomainName` field expects only the first part of a subdomain
        const transferBody = JSON.parse(fetchMock.mock.calls.slice(-1)[0][1]?.body as string);
        expect(transferBody.subdomains_list[0].subdomainName).not.toContain('.');
      }
    }
  );

  test('Subdomain signature verification', () => {
    const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
    // Generate Subdomain Operation payload starting with signature
    const subDomainOp: SubdomainOp = {
      subdomainName: 'test.id.stx',
      owner: 'ST3WTH31TWVYDD1YGYKSZK8XFJ3Z1Z5JMGGRF4558',
      zonefile:
        '$ORIGIN test1.id.stx\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://gaia.blockstack.org/hub/12imq5x4FdqMJVdLAsaRnWTe662ddyWJRT/profile.json"\n\n',
      sequenceNumber: 1,
    };
    const subdomainPieces = subdomainOpToZFPieces(subDomainOp);
    const textToSign = subdomainPieces.txt.join(',');
    // Generate signature: https://docs.stacks.co/build-apps/references/bns#subdomain-lifecycle
    /**
     * *********************** IMPORTANT **********************************************
     * subdomain operation will only be accepted if it has a later "sequence=" number,*
     * and a valid signature in "sig=" over the transaction body .The "sig=" field    *
     * includes both the public key and signature, and the public key must hash to    *
     * the previous subdomain operation's "addr=" field                               *
     * ********************************************************************************
     */
    const hash = crypto.createHash('sha256').update(textToSign).digest('hex');
    const sig = signWithKey(privateKey, hash);

    subDomainOp.signature = sig; // Assign signature to subDomainOp

    // Verify that the generated signature is valid
    const pubKey = publicKeyFromSignatureVrs(hash, sig);
    // Skip the recovery params bytes from signature and then verify
    const isValid = verifySignature(subDomainOp.signature.slice(2), hash, pubKey);

    expect(isValid).toEqual(true);
  });
});

test('can_stack', async () => {
  fetchMock.resetMocks();
  fetchMock.mockOnce(
    `{"stx":{"balance":"16216000000000","total_sent":"0","total_received":"0","total_fees_sent":"0","total_miner_rewards_received":"0","lock_tx_id":"","locked":"0","lock_height":0,"burnchain_lock_height":0,"burnchain_unlock_height":0},"fungible_tokens":{},"non_fungible_tokens":{}}`
  );
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

  expect(fetchMock.mock.calls).toHaveLength(5);
  expect(fetchMock.mock.calls[4][0]).toContain('/pox/can-stack-stx');
  expect(fetchMock.mock.calls[4][1]?.body).toBe(
    '{"sender":"ST3VJVZ265JZMG1N61YE3EQ7GNTQHF6PXP0E7YACV","arguments":["0x0c000000020968617368627974657302000000147046a658021260485e1ba9eb6c3e4c26b60953290776657273696f6e020000000100","0x010000000000000000000005a74678d000","0x010000000000000000000000000000010d","0x010000000000000000000000000000000a"]}'
  );
});

describe('CLI Main', () => {
  test('argparse should work', () => {
    process.argv = ['node', 'stx', 'make_keychain'];
    jest.spyOn(process, 'exit').mockImplementation();
    expect(() => CLIMain()).not.toThrow();
  });
});
