import { getStacksWalletKeyInfo } from '../src/keys';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { loadConfig, DEFAULT_CONFIG_PATH } from '../src/argparse';

// setup
const networkType = 'mainnet';
const configData = loadConfig(DEFAULT_CONFIG_PATH, networkType);
const wrappedNetwork = getNetwork(configData, false);
const blockstackNetwork = new CLINetworkAdapter(wrappedNetwork, {} as CLI_NETWORK_OPTS);

test('getStacksWalletKeyInfo', async () => {
  const mnemonic =
    'injury oxygen river foot pelican divert proud venture divert tired tomato middle frozen task news bullet love mimic expect share sunset equip absent hub';
  const info = await getStacksWalletKeyInfo(blockstackNetwork, mnemonic);

  expect(info).toEqual({
    privateKey: 'c6776f323c7f50100777472079fd754b706bacdbb8932a6485fb2040ec6df18801',
    address: 'SP2QJ66HRQK5A9FMVPJPW72Z0AWRHMNXZ4PQXWZ1M',
    btcAddress: '1Gy3JXjEWJNejnfVVeznbZwcd4iDCk9TB2',
    wif: 'L3sWBNt3Ft3XV1E587CgqWgTDHbFtxcWQ1W8eke8SeY1i1SK942d',
    index: 0,
  });
});
