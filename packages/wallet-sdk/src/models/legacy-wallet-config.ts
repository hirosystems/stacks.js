import { decryptContent } from '@stacks/encryption';
import { createFetchFn, FetchFn } from '@stacks/network';
import { GaiaHubConfig } from '@stacks/storage';
import { deriveLegacyConfigPrivateKey } from '../derive';
import { Wallet, getRootNode } from './common';

export interface LegacyConfigApp {
  origin: string;
  scopes: string[];
  lastLoginAt: number;
  appIcon: string;
  name: string;
}

interface LegacyConfigIdentity {
  username?: string;
  address: string;
  apps: {
    [origin: string]: LegacyConfigApp;
  };
}

export interface LegacyWalletConfig {
  identities: LegacyConfigIdentity[];
  hideWarningForReusingIdentity?: boolean;
}

export async function fetchLegacyWalletConfig({
  wallet,
  gaiaHubConfig,
  fetchFn = createFetchFn(),
}: {
  wallet: Wallet;
  gaiaHubConfig: GaiaHubConfig;
  fetchFn?: FetchFn;
}) {
  const rootNode = getRootNode(wallet);
  const legacyConfigKey = deriveLegacyConfigPrivateKey(rootNode);
  try {
    const response = await fetchFn(
      `${gaiaHubConfig.url_prefix}${gaiaHubConfig.address}/wallet-config.json`
    );
    if (!response.ok) return null;
    const encrypted = await response.text();
    const configJSON = (await decryptContent(encrypted, {
      privateKey: legacyConfigKey,
    })) as string;
    const config: LegacyWalletConfig = JSON.parse(configJSON);
    return config;
  } catch (error) {
    console.error(error);
    return null;
  }
}
