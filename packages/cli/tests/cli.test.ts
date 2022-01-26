import { testables } from '../src/cli';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { CLI_CONFIG_TYPE } from '../src/argparse';

import * as fixtures from './fixtures/cli.fixture';
import inquirer from 'inquirer';
import {ClarityAbi} from '@stacks/transactions';
import {readFileSync} from 'fs';
import path from 'path';
import fetchMock from 'jest-fetch-mock';
import { makekeychainTests, keyInfoTests, MakeKeychainResult, WalletKeyInfoResult } from './derivation-path/keychain';

const TEST_ABI: ClarityAbi = JSON.parse(readFileSync(path.join(__dirname, './abi/test-abi.json')).toString());
const TEST_FEE_ESTIMATE = JSON.parse(readFileSync(path.join(__dirname, './fee-estimate/test-fee-estimate.json')).toString());
jest.mock('inquirer');

const { addressConvert, contractFunctionCall, makeKeychain, getStacksWalletKey, preorder, register } = testables as any;

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
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey
    ];
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
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey
    ];
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
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey
    ];
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
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey
    ];
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
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey
    ];
    const contractInputArg = {
      bufferArg: 'string buffer'
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
  test.each(makekeychainTests)('Make keychain using custom derivation path %#', async (derivationPath: string, keyChainResult: MakeKeychainResult) => {
    const encrypted = 'vim+XrRNSm+SqSn0MyWNEi/e+UK5kX8WGCLE/sevT6srZG+quzpp911sWP0CcvsExCH1M4DgOfOldMitLdkq1b6rApDwtAcOWdAqiaBk37M=';
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
  });

  test.each(keyInfoTests)('Make keychain using custom derivation path %#', async (derivationPath: string, walletInfoResult: WalletKeyInfoResult ) => {
    const encrypted = 'vim+XrRNSm+SqSn0MyWNEi/e+UK5kX8WGCLE/sevT6srZG+quzpp911sWP0CcvsExCH1M4DgOfOldMitLdkq1b6rApDwtAcOWdAqiaBk37M=';
    const args = [encrypted, derivationPath];

    // Mock TTY
    process.stdin.isTTY = true;
    process.env.password = 'supersecret';

    const walletKey = await getStacksWalletKey(testnetNetwork, args);
    const result = JSON.parse(walletKey);
    expect(result).toEqual([
      walletInfoResult
    ]);
    // Unmock TTY
    process.stdin.isTTY = false;
    process.env.password = undefined;
  });
});

describe('BNS', () => {
  test('buildRegisterNameTx', async () => {
    const fullyQualifiedName = 'test.id';
    const ownerKey = '0d146cf7289dd0b6f41385b0dbc733167c5dffc6534c59cafd63a615f59095d8';
    const salt =  'salt';
    const zonefile = 'zonefile';

    const args = [
      fullyQualifiedName,
      ownerKey,
      salt,
      zonefile,
    ];

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
    const salt =  'salt';
    const stxToBurn = '1000';

    const args = [
      fullyQualifiedName,
      privateKey,
      salt,
      stxToBurn,
    ];

    const mockedResponse = JSON.stringify(TEST_FEE_ESTIMATE);

    fetchMock.mockOnce(mockedResponse);
    fetchMock.mockOnce(JSON.stringify({ nonce: 1000 }));
    fetchMock.mockOnce(JSON.stringify('success'));

    const txResult = await preorder(testnetNetwork, args);

    expect(txResult.txid).toEqual('0xsuccess');
  });
});
