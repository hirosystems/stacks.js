import { StacksMainnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';

import { generateWallet, restoreWalletAccounts } from '../../src';
import { mockGaiaHubInfo } from '../mocks';

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
    network: new StacksMainnet(),
  });

  expect(wallet?.accounts[0]?.username).toEqual(undefined);
  expect(wallet?.accounts[0]?.stxPrivateKey.slice(0, 64)).toEqual(stxPrivateKey);
});

test.skip('restore wallet with username owned by stx private key', async () => {
  const secretKey = SECRET_KEY;

  const baseWallet = await generateWallet({ secretKey, password: 'password' });
  const stxPrivateKey = baseWallet.accounts[0].stxPrivateKey.slice(0, 64);

  fetchMock
    .once(mockGaiaHubInfo)
    .once(JSON.stringify('no found'), { status: 404 }) // TODO mock fetch legacy wallet config
    .once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }))
    .once(JSON.stringify('ok')); // updateWalletConfig

  const wallet = await restoreWalletAccounts({
    wallet: baseWallet,
    gaiaHubUrl: 'https://hub.gaia.com',
    network: new StacksMainnet(),
  });

  expect(wallet?.accounts[0]?.username).toEqual('public_profile_for_testing.id.blockstack');
  expect(wallet?.accounts[0]?.stxPrivateKey.slice(0, 64)).toEqual(stxPrivateKey);
});
