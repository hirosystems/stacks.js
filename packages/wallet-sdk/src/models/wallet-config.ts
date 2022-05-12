import { Account, Wallet } from './common';
import { GaiaHubConfig, connectToGaiaHub, uploadToGaiaHub } from '@stacks/storage';
import { decryptContent, encryptContent, getPublicKeyFromPrivate } from '@stacks/encryption';
import { createFetchFn, FetchFn } from '@stacks/network';

export interface ConfigApp {
  origin: string;
  scopes: string[];
  lastLoginAt: number;
  appIcon: string;
  name: string;
}

export interface ConfigAccount {
  username?: string;
  apps: {
    [origin: string]: ConfigApp;
  };
}

export interface WalletConfig {
  accounts: ConfigAccount[];
  meta?: {
    [key: string]: any;
  };
}

export const createWalletGaiaConfig = async ({
  gaiaHubUrl,
  wallet,
}: {
  gaiaHubUrl: string;
  wallet: Wallet;
}): Promise<GaiaHubConfig> => {
  return connectToGaiaHub(gaiaHubUrl, wallet.configPrivateKey);
};

export const getOrCreateWalletConfig = async ({
  wallet,
  gaiaHubConfig,
  skipUpload,
  fetchFn = createFetchFn(),
}: {
  wallet: Wallet;
  gaiaHubConfig: GaiaHubConfig;
  skipUpload?: boolean;
  fetchFn?: FetchFn;
}): Promise<WalletConfig> => {
  const config = await fetchWalletConfig({ wallet, gaiaHubConfig, fetchFn });
  if (config) return config;
  const newConfig = makeWalletConfig(wallet);
  if (!skipUpload) {
    await updateWalletConfig({ wallet, gaiaHubConfig });
  }
  return newConfig;
};

export const fetchWalletConfig = async ({
  wallet,
  gaiaHubConfig,
  fetchFn = createFetchFn(),
}: {
  wallet: Wallet;
  gaiaHubConfig: GaiaHubConfig;
  fetchFn?: FetchFn;
}) => {
  try {
    const response = await fetchFn(
      `${gaiaHubConfig.url_prefix}${gaiaHubConfig.address}/wallet-config.json`
    );
    if (!response.ok) return null;
    const encrypted = await response.text();
    const configJSON = (await decryptContent(encrypted, {
      privateKey: wallet.configPrivateKey,
    })) as string;
    const config: WalletConfig = JSON.parse(configJSON);
    return config;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateWalletConfig = async ({
  wallet,
  walletConfig: _walletConfig,
  gaiaHubConfig,
}: {
  wallet: Wallet;
  walletConfig?: WalletConfig;
  gaiaHubConfig: GaiaHubConfig;
}) => {
  const walletConfig = _walletConfig || makeWalletConfig(wallet);
  const encrypted = await encryptWalletConfig({ wallet, walletConfig });
  await uploadToGaiaHub(
    'wallet-config.json',
    encrypted,
    gaiaHubConfig,
    undefined,
    undefined,
    undefined,
    true
  );
  return walletConfig;
};

export function makeWalletConfig(wallet: Wallet): WalletConfig {
  return {
    accounts: wallet.accounts.map(account => ({
      username: account.username,
      apps: {},
    })),
  };
}

export const encryptWalletConfig = async ({
  wallet,
  walletConfig,
}: {
  wallet: Wallet;
  walletConfig: WalletConfig;
}) => {
  const publicKey = getPublicKeyFromPrivate(wallet.configPrivateKey);
  const encrypted = await encryptContent(JSON.stringify(walletConfig), { publicKey });
  return encrypted;
};

export const updateWalletConfigWithApp = async ({
  wallet,
  account,
  app,
  gaiaHubConfig,
  walletConfig,
}: {
  wallet: Wallet;
  account: Account;
  app: ConfigApp;
  gaiaHubConfig: GaiaHubConfig;
  walletConfig: WalletConfig;
}) => {
  wallet.accounts.forEach((account, index) => {
    const configApp = walletConfig.accounts[index];
    if (configApp) {
      configApp.apps = configApp.apps || {};
      configApp.username = account.username;
      walletConfig.accounts[index] = configApp;
    } else {
      walletConfig.accounts.push({
        username: account.username,
        apps: {},
      });
    }
  });

  const configAccount = walletConfig.accounts[account.index];
  configAccount.apps = configAccount.apps || {};
  configAccount.apps[app.origin] = app;
  walletConfig.accounts[account.index] = configAccount;
  await updateWalletConfig({ wallet, walletConfig: walletConfig, gaiaHubConfig });
  return walletConfig;
};
