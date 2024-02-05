import fetchMock from 'jest-fetch-mock';

import { generateWallet, restoreWalletAccounts } from '../../src';
import { mockGaiaHubInfo } from '../mocks';
import { STACKS_MAINNET } from '@stacks/network';

const SECRET_KEY =
  'sound idle panel often situate develop unit text design antenna ' +
  'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
  'update opinion media';

beforeEach(() => {
  fetchMock.resetMocks();
});

test('restore wallet with username not owned by stx private key', async () => {
  const secretKey = SECRET_KEY;
  const baseWallet = await generateWallet({ secretKey, password: 'password' });
  const stxPrivateKey = baseWallet.accounts[0].stxPrivateKey.slice(0, 64);

  fetchMock
    .once(mockGaiaHubInfo)
    .once(JSON.stringify('no found'), { status: 404 }) // TODO mock fetch legacy wallet config
    .once(JSON.stringify({ names: [] }))
    .once(JSON.stringify('ok')); // updateWalletConfig

  const wallet = await restoreWalletAccounts({
    wallet: baseWallet,
    gaiaHubUrl: 'https://hub.gaia.com',
    network: STACKS_MAINNET,
  });

  expect(wallet?.accounts[0]?.username).toEqual(undefined);
  expect(wallet?.accounts[0]?.stxPrivateKey.slice(0, 64)).toEqual(stxPrivateKey);
});

test('restore wallet with username owned by stx private key', async () => {
  const secretKey = SECRET_KEY;

  const baseWallet = await generateWallet({ secretKey, password: 'password' });
  const stxPrivateKey = baseWallet.accounts[0].stxPrivateKey.slice(0, 64);

  fetchMock
    .once(mockGaiaHubInfo)
    .once(JSON.stringify('no found'), { status: 404 }) // TODO mock fetch legacy wallet config
    .once(
      JSON.stringify({
        // mock wallet-config.json
        iv: 'a39461ec18e5dea8ac759d5b8141319d',
        ephemeralPK: '03e04d0046a9dd5b7a8fea4de55a8d912909738b26f2c72f8e5962217fa45f00bb',
        cipherText:
          'bf16d2da29b54a153d553ab99597096f3fa11bd964441927355c1d979bf614477c8ceba7098620a37fa98f92f0f79813f771b6e2c2087e6fd2b1675d98a5e14f28cba28134dac2913bcb06f469439a16b47778747c7e93f50169727a7b9053b5441c8645fc729b28f063d2ffd673a01342e2cbc4fbf0e05350a67ec53ee3b7e43ff4e2dddbded5868cc3f5c4ca323b621bd13b5f9f036dc4406c2418e98b1b905974479cc79ab102d9ba1eb7fe858987dd0777ed3b0356d6bd0bc775213ef878bffaa58c40365d831a9e436fbfc388bcff2909659cab38a65ae8512508f6fda247437d4819c98ea15e48a4a00c1594eb58f7bf7eb85aad7cd51e5b43a7ca1fec06385be125d0b8c07bac1ac1094bb4687e620f23a5a14f4b20674ccd198271eb2451f12ad294efa79a9b5a001a3682a5ec833140b78333f57ce9912f60ff94edf99ee0b5e59ddfe7fb4a1472c0d303eeab22471585a5a5689ed9779e4ded10a4feecf5107df4c847522b2d6c95ed1e45cccb8b834b47a79f6671b49ffbdb02e4887465ca521472b7f11a53be0221eaeeffed2c6cf4d17a6fdae4b8f2b963d8a102c5376e6fa01bdaf9dc3d544c9954090b23fc02c8f500319b0cc43d7f73ff5012514d473afc818967eb0d0837a9c6920f9bc39e5f49fefdbc4fa33e6be88820a1abaeacb836bd398e7031d4286121383f53e2873ea1c2f0b649a12aec7db049505c58323fb34aaaf8d59fc0b962df05b8e9ea0dabf7fc9923b25af9ff3bd08a0b2dea7462a9e889485aba8605592308847468e843fca721a70aae9528d4abaae1a539f57c624f06b5b7dfdcf0a9d94b509697a1d0020b5f0b60ab19cc6abaf14928612663a9b6f15e18174a0a31fc506c428df13889fd877b7b639106d72c1b9dc8509758035337776c9d2d489da61f8de92a880b8ab802bd098fea111ab6af59fadd275285c59a98f824d5023990664856f971a6928869d3447f4426cb6855be55e43778f65a77e4d4348da0eda3e45e56a5d8fd11aff6ec62f53eac1cd862',
        mac: '623331e6804bf8c0dee7db7894a84ed02c70bf1ec0b6a5b2ccaff7d0638a9d88',
        wasString: true,
      })
    )
    .once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }))
    .once(JSON.stringify('ok')); // updateWalletConfig

  const wallet = await restoreWalletAccounts({
    wallet: baseWallet,
    gaiaHubUrl: 'https://hub.gaia.com',
    network: STACKS_MAINNET,
  });

  expect(wallet?.accounts[0]?.username).toEqual('public_profile_for_testing.id.blockstack');
  expect(wallet?.accounts[0]?.stxPrivateKey.slice(0, 64)).toEqual(stxPrivateKey);
});
