import {
  encryptWalletConfig,
  createWalletGaiaConfig,
  fetchWalletConfig,
  getOrCreateWalletConfig,
  ConfigApp,
  updateWalletConfigWithApp,
  updateWalletConfig,
  WalletConfig,
} from '../../src/models/wallet-config';
import { mockWallet, mockWalletConfig, mockGaiaHubInfo } from '../mocks';
import { decryptContent } from '@stacks/encryption';
import fetchMock from 'jest-fetch-mock';

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

const gaiaHubUrl = 'https://gaia.blockstack.org/hub';

describe(fetchWalletConfig, () => {
  test('returns no config if not found', async () => {
    fetchMock.once(mockGaiaHubInfo).once('', { status: 404 });

    const gaiaHubConfig = await createWalletGaiaConfig({
      wallet: mockWallet,
      gaiaHubUrl,
    });
    const config = await fetchWalletConfig({ wallet: mockWallet, gaiaHubConfig });
    expect(config).toEqual(null);
  });

  test('returns config if file is present', async () => {
    const wallet = mockWallet;
    const encrypted = await encryptWalletConfig({ wallet, walletConfig: mockWalletConfig });

    fetchMock.once(mockGaiaHubInfo).once(encrypted);

    const gaiaHubConfig = await createWalletGaiaConfig({
      wallet: mockWallet,
      gaiaHubUrl,
    });
    const config = await fetchWalletConfig({ wallet: mockWallet, gaiaHubConfig });
    expect(config).not.toBeFalsy();
    if (!config) {
      throw 'Must have config present';
    }
    expect(config.accounts.length).toEqual(1);
    const account = config.accounts[0];
    expect(account.apps['http://localhost:3000']).toEqual(
      mockWalletConfig.accounts[0].apps['http://localhost:3000']
    );
  });
});

test('creates a config if not found', async () => {
  fetchMock
    .once(mockGaiaHubInfo)
    .once('', { status: 404 })
    .once(JSON.stringify({ publicUrl: 'asdf' }));

  const wallet = mockWallet;
  const gaiaHubConfig = await createWalletGaiaConfig({
    wallet: mockWallet,
    gaiaHubUrl,
  });
  const walletConfig = await getOrCreateWalletConfig({ wallet, gaiaHubConfig });
  expect(Object.keys(walletConfig.accounts[0].apps).length).toEqual(0);
  const [url, uploadResult] = fetchMock.mock.calls[2];
  if (!uploadResult) throw 'Expected wallet config to be uploaded';
  const { headers } = uploadResult;
  if (!headers) throw 'Expected authorization header.';
  const authHeader = (headers as Record<string, string>)['Authorization'];
  expect(authHeader).toEqual(`bearer ${gaiaHubConfig.token}`);
  expect(url).toEqual(
    'https://gaia.blockstack.org/hub/store/1AdVqZKxeFLGxrK6TwDcZsdYsCKMMxmm8M/wallet-config.json'
  );
  const decrypted = await decryptContent(uploadResult.body as string, {
    privateKey: wallet.configPrivateKey,
  });
  expect(JSON.parse(decrypted as string)).toEqual(walletConfig);
});

test('updates existing wallet config with auth info', async () => {
  fetchMock
    .once(mockGaiaHubInfo)
    .once('', { status: 404 })
    .once(JSON.stringify({ publicUrl: 'asdf' }))
    .once(JSON.stringify({ publicUrl: 'asdf' }));

  const wallet = mockWallet;
  const [account] = wallet.accounts;
  const gaiaHubConfig = await createWalletGaiaConfig({
    wallet: mockWallet,
    gaiaHubUrl,
  });
  const walletConfig = await getOrCreateWalletConfig({ wallet, gaiaHubConfig });
  const app: ConfigApp = {
    origin: 'http://localhost:5000',
    scopes: ['read_write'],
    lastLoginAt: new Date().getTime(),
    name: 'Tester',
    appIcon: 'asdf',
  };
  const newConfig = await updateWalletConfigWithApp({
    wallet,
    app,
    gaiaHubConfig,
    account,
    walletConfig,
  });
  expect(fetchMock.mock.calls.length).toEqual(4);
  const uploadResult = fetchMock.mock.calls[3][1];
  if (!uploadResult) throw 'Expected wallet config to be uploaded';
  const decrypted = await decryptContent(uploadResult.body as string, {
    privateKey: wallet.configPrivateKey,
  });
  const config: WalletConfig = JSON.parse(decrypted as string);
  expect(config).toEqual(newConfig);
  expect(config.accounts[0].apps['http://localhost:5000']).toEqual(app);
  expect(Object.keys(config.accounts[0].apps)).toEqual(['http://localhost:5000']);
});

test('can add meta info to wallet config', async () => {
  fetchMock
    .once(mockGaiaHubInfo)
    .once('', { status: 404 })
    .once(JSON.stringify({ publicUrl: 'asdf' }))
    .once(JSON.stringify({ publicUrl: 'asdf' }));

  const wallet = mockWallet;
  const gaiaHubConfig = await createWalletGaiaConfig({
    wallet: mockWallet,
    gaiaHubUrl,
  });
  const walletConfig = await getOrCreateWalletConfig({ wallet, gaiaHubConfig });
  const newConfig = {
    ...walletConfig,
    meta: {
      hideWarningForReusingIdentity: true,
    },
  };
  await updateWalletConfig({ wallet, gaiaHubConfig, walletConfig: newConfig });
  const uploadResult = fetchMock.mock.calls[3][1];
  if (!uploadResult) throw 'Expected wallet config to be uploaded';
  const decrypted = await decryptContent(uploadResult.body as string, {
    privateKey: wallet.configPrivateKey,
  });
  const config: WalletConfig = JSON.parse(decrypted as string);
  expect(config.meta).toEqual({ hideWarningForReusingIdentity: true });
});
