import { getStacksWalletKeyInfo, getOwnerKeyInfo, findIdentityIndex } from '../src/keys';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { CLI_CONFIG_TYPE } from '../src/argparse';
import { keyInfoTests, WalletKeyInfoResult } from './derivation-path/wallet.key.info';

import * as fixtures from './fixtures/keys.fixture';

// setup
const mainnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, false),
  {} as CLI_NETWORK_OPTS
);

test('getStacksWalletKeyInfo', async () => {
  const mnemonic = 'apart spin rich leader siren foil dish sausage fee pipe ethics bundle';
  const info = await getStacksWalletKeyInfo(mainnetNetwork, mnemonic);

  expect(info).toEqual({
    privateKey: '25899fab1b9b95cc2d1692529f00fb788e85664df3d14db1a660f33c5f96d8ab01',
    address: 'SP3RBZ4TZ3EK22SZRKGFZYBCKD7WQ5B8FFS0AYVF7',
    btcAddress: '1Nwxfx7VoYAg2mEN35dTRw4H7gte8ajFki',
    wif: 'KxUgLbeVeFZEUUQpc3ncYn5KFB3WH5MVRv3SJ2g5yPwkrXs3QRaP',
    index: 0,
  });
});

describe('getStacksWalletKeyInfo custom derivation path', () => {
  test.each(keyInfoTests)('%#', async (derivationPath: string, keyInfoResult: WalletKeyInfoResult)  => {
    const mnemonic = 'apart spin rich leader siren foil dish sausage fee pipe ethics bundle';
    const info = await getStacksWalletKeyInfo(mainnetNetwork, mnemonic, derivationPath);

    expect(info).toEqual(keyInfoResult);
  });
});

describe('getOwnerKeyInfo', () => {
  test.each(fixtures.getOwnerKeyInfo)('%#', async (mnemonic, index, version, result) => {
    const info = await getOwnerKeyInfo(mainnetNetwork, mnemonic, index, version);
    expect(info).toEqual(result);
  });
});

describe('findIdentityIndex', () => {
  test.each(fixtures.findIdentityIndex)('%#', async (mnemonic, idAddress, result) => {
    const info = await findIdentityIndex(mainnetNetwork, mnemonic, idAddress);
    expect(info).toEqual(result);
  });
});
