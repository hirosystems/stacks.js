import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { Cl, ClarityAbi, makeContractCall } from '@stacks/transactions';
import { readFileSync } from 'fs';
import inquirer from 'inquirer';
import fetchMock from 'jest-fetch-mock';
import path from 'path';
import { CLI_CONFIG_TYPE } from '../src/argparse';
import { parseDirectFunctionArgs, testables } from '../src/cli';
import { CLINetworkAdapter, CLI_NETWORK_OPTS, getNetwork } from '../src/network';

const { contractFunctionCall } = testables as any;

const TEST_ABI: ClarityAbi = JSON.parse(
  readFileSync(path.join(__dirname, './abi/test-abi.json')).toString()
);

fetchMock.enableMocks();

const testnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, true),
  {} as CLI_NETWORK_OPTS
);

describe('"contract_function_call" command', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Should fall back to interactive prompts when no direct arguments provided', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-primitive-argument';
    const fee = '230';
    const nonce = '3';
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const args = [contractAddress, contractName, functionName, fee, nonce, privateKey]; // No contract args

    const contractInputArg = {
      amount: '1000',
      address: contractAddress,
      exists: 'false',
    };

    // @ts-ignore
    inquirer.prompt = jest.fn().mockResolvedValue(contractInputArg); // Mock the inquirer prompt to return our test values

    fetchMock.once(JSON.stringify(TEST_ABI));
    fetchMock.once(
      JSON.stringify({
        txid: '0x94b1cfab79555b8c6725f19e4fcd6268934d905578a3e8ef7a1e542b931d3676',
      })
    );

    const expectedTx = await makeContractCall({
      contractAddress,
      contractName,
      functionName,
      functionArgs: [Cl.uint(1000), Cl.address(contractAddress), Cl.bool(false)],
      senderKey: privateKey,
      fee,
      nonce,
      network: STACKS_TESTNET,
      postConditionMode: 'allow',
    });

    await contractFunctionCall(testnetNetwork, args);

    expect(inquirer.prompt).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/v2/contracts/interface/${contractAddress}/${contractName}`
    );

    expect(fetchMock.mock.calls[1][0]).toContain('/v2/transactions');

    const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(body.tx).toBeTruthy();
    expect(body.tx).toEqual(expectedTx.serialize());
  });

  test('Should use provided contract args when provided', async () => {
    const contractAddress = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const contractName = 'test-contract-name';
    const functionName = 'test-func-primitive-argument';
    const fee = '230';
    const nonce = '3';
    const privateKey = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
    const contractArgs = [Cl.uint(1000), Cl.address(contractAddress), Cl.bool(false)]
      .map(Cl.stringify)
      .join(', ');
    const args = [
      contractAddress,
      contractName,
      functionName,
      fee,
      nonce,
      privateKey,
      contractArgs,
    ];

    expect(contractArgs).toEqual("u1000, 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6, false");

    fetchMock.once(JSON.stringify(TEST_ABI));
    fetchMock.once(
      JSON.stringify({
        txid: '0x94b1cfab79555b8c6725f19e4fcd6268934d905578a3e8ef7a1e542b931d3676',
      })
    );

    const expectedTx = await makeContractCall({
      contractAddress,
      contractName,
      functionName,
      functionArgs: parseDirectFunctionArgs(contractArgs),
      senderKey: privateKey,
      fee,
      nonce,
      network: STACKS_TESTNET,
      postConditionMode: 'allow',
    });

    await contractFunctionCall(testnetNetwork, args);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/v2/contracts/interface/${contractAddress}/${contractName}`
    );

    expect(fetchMock.mock.calls[1][0]).toContain('/v2/transactions');

    const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(body.tx).toBeTruthy();
    expect(body.tx).toEqual(expectedTx.serialize());
  });
});

test('"parseDirectFunctionArgs" should work for all types with a stringify and comma join', () => {
  const clarityValues = [
    // Primitive types
    Cl.uint(1000),
    Cl.int(-42),
    Cl.bool(true),
    Cl.address(STACKS_MAINNET.bootAddress),
    Cl.stringAscii('hello'),
    Cl.stringUtf8('world 🌍'),
    Cl.stringAscii('text, with, commas, and escapes: \\, " \\" \\", \\(, \\), \\{ \\}'),
    Cl.stringUtf8('text (with (parentheses'),
    Cl.stringAscii('text {with {curly braces'),
    Cl.stringUtf8('complex )text, }with, everything}), 🌍'),

    // Buffer types
    Cl.bufferFromHex('010203'),
    Cl.bufferFromAscii('test'),
    Cl.bufferFromUtf8('utf8 🚀'),

    // Optional types
    Cl.some(Cl.uint(123)),
    Cl.none(),

    // Response types
    Cl.ok(Cl.bool(true)),
    Cl.error(Cl.uint(404)),

    // Complex nested structures
    Cl.list([
      Cl.list([Cl.int(1), Cl.int(2), Cl.int(3)]),
      Cl.list([
        Cl.tuple({ x: Cl.uint(10), y: Cl.uint(20) }),
        Cl.tuple({ x: Cl.uint(30), y: Cl.uint(40) }),
      ]),
    ]),

    // Complex tuple with mixed types
    Cl.tuple({
      address: Cl.address(STACKS_MAINNET.bootAddress),
      settings: Cl.tuple({
        active: Cl.bool(true),
        name: Cl.stringUtf8('test settings'),
        values: Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]),
        metadata: Cl.some(
          Cl.tuple({
            version: Cl.uint(1),
            hash: Cl.bufferFromHex('deadbeef'),
          })
        ),
      }),
    }),
  ];

  const contractArgs = clarityValues.map(Cl.stringify).join(' , ');
  expect(parseDirectFunctionArgs(contractArgs)).toEqual(clarityValues);
});
