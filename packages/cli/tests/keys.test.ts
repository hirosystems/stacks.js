import { getStacksWalletKeyInfo } from '../src/keys';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { loadConfig, DEFAULT_CONFIG_PATH } from '../src/argparse';

// setup
const networkType = 'mainnet';
const configData = loadConfig(DEFAULT_CONFIG_PATH, networkType);
const wrappedNetwork = getNetwork(configData, false);
const blockstackNetwork = new CLINetworkAdapter(wrappedNetwork, {} as CLI_NETWORK_OPTS);

test('getStacksWalletKeyInfo', async () => {
  const mnemonic = 'apart spin rich leader siren foil dish sausage fee pipe ethics bundle';
  const info = await getStacksWalletKeyInfo(blockstackNetwork, mnemonic);

  expect(info).toEqual({
    privateKey: '25899fab1b9b95cc2d1692529f00fb788e85664df3d14db1a660f33c5f96d8ab01',
    address: 'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7',
    btcAddress: '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki',
    wif: 'KxUgLbeVeFZEUUQpc3ncYn5KFB3WH5MVRv3SJ2g5yPwkrXs3QRaP',
    index: 0,
  });
});
