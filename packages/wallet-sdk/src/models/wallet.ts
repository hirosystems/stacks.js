import { NetworkClientParam, clientFromNetwork, networkFrom } from '@stacks/network';
import { DerivationType, deriveStxPrivateKey, fetchUsernameForAccountByDerivationType } from '..';
import { deriveAccount, deriveLegacyConfigPrivateKey } from '../derive';
import { connectToGaiaHubWithConfig, getHubInfo } from '../utils';
import { Wallet, getRootNode } from './common';
import { fetchLegacyWalletConfig } from './legacy-wallet-config';
import { WalletConfig, fetchWalletConfig, updateWalletConfig } from './wallet-config';

export interface LockedWallet {
  encryptedSecretKey: string;
}

/**
 * Restore wallet accounts by checking for encrypted WalletConfig files,
 * stored in Gaia.
 *
 * This helps provide a better UX for users, so we can keep track of accounts they've
 * created, and usernames they've used.
 * @deprecated The usage of storing wallet related information on Gaia isn't widely used.
 */
export async function restoreWalletAccounts({
  wallet,
  gaiaHubUrl,
  network = 'mainnet',
  client: _client,
}: {
  wallet: Wallet;
  gaiaHubUrl: string;
} & NetworkClientParam): Promise<Wallet> {
  const client = Object.assign({}, clientFromNetwork(networkFrom(network)), _client);

  const hubInfo = await getHubInfo(gaiaHubUrl, client.fetch);
  const rootNode = getRootNode(wallet);
  const legacyGaiaConfig = connectToGaiaHubWithConfig({
    hubInfo,
    privateKey: deriveLegacyConfigPrivateKey(getRootNode(wallet)),
    gaiaHubUrl,
  });
  const currentGaiaConfig = connectToGaiaHubWithConfig({
    hubInfo,
    privateKey: wallet.configPrivateKey,
    gaiaHubUrl,
  });

  const [walletConfig, legacyWalletConfig] = await Promise.all([
    fetchWalletConfig({ wallet, gaiaHubConfig: currentGaiaConfig, fetchFn: client.fetch }),
    fetchLegacyWalletConfig({ wallet, gaiaHubConfig: legacyGaiaConfig, fetchFn: client.fetch }),
  ]);
  // Restore from existing config
  if (
    walletConfig &&
    walletConfig.accounts.length >= (legacyWalletConfig?.identities.length || 0)
  ) {
    const newAccounts = await Promise.all(
      walletConfig.accounts.map(async (_, index) => {
        let existingAccount = wallet.accounts[index];
        const { username } = await fetchUsernameForAccountByDerivationType({
          rootNode,
          index,
          derivationType: DerivationType.Wallet,
          network,
        });
        if (!existingAccount) {
          existingAccount = deriveAccount({
            rootNode,
            index,
            salt: wallet.salt,
            stxDerivationType: DerivationType.Wallet,
          });
        } else {
          existingAccount = {
            ...existingAccount,
            stxPrivateKey: deriveStxPrivateKey({
              rootNode,
              index,
            }),
          };
        }
        return {
          ...existingAccount,
          username,
        };
      })
    );

    return {
      ...wallet,
      accounts: newAccounts,
    };
  }

  // Restore from legacy config, and upload a new one
  if (legacyWalletConfig) {
    const newAccounts = await Promise.all(
      legacyWalletConfig.identities.map(async (_, index) => {
        let existingAccount = wallet.accounts[index];
        const { username } = await fetchUsernameForAccountByDerivationType({
          rootNode,
          index,
          derivationType: DerivationType.Wallet,
          network,
        });
        if (!existingAccount) {
          existingAccount = deriveAccount({
            rootNode,
            index,
            salt: wallet.salt,
            stxDerivationType: DerivationType.Wallet,
          });
        } else {
          existingAccount = {
            ...existingAccount,
            stxPrivateKey: deriveStxPrivateKey({
              rootNode,
              index,
            }),
          };
        }
        return {
          ...existingAccount,
          username,
        };
      })
    );

    const meta: Record<string, boolean> = {};
    if (legacyWalletConfig.hideWarningForReusingIdentity) {
      meta.hideWarningForReusingIdentity = true;
    }
    const newConfig: WalletConfig = {
      accounts: legacyWalletConfig.identities.map(identity => ({
        username: identity.username,
        apps: identity.apps,
      })),
      meta,
    };

    await updateWalletConfig({
      wallet,
      walletConfig: newConfig,
      gaiaHubConfig: currentGaiaConfig,
    });

    return {
      ...wallet,
      accounts: newAccounts,
    };
  }

  return wallet;
}
