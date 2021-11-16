import { deriveAccount, deriveLegacyConfigPrivateKey } from '../derive';
import { connectToGaiaHubWithConfig, getHubInfo } from '../utils';
import { Wallet, getRootNode } from './common';
import { fetchLegacyWalletConfig } from './legacy-wallet-config';
import { fetchWalletConfig, updateWalletConfig, WalletConfig } from './wallet-config';

export interface LockedWallet {
  encryptedSecretKey: string;
}

/**
 * Restore wallet accounts by checking for encrypted WalletConfig files,
 * stored in Gaia.
 *
 * This helps provide a better UX for users, so we can keep track of accounts they've
 * created, and usernames they've used.
 */
export async function restoreWalletAccounts({
  wallet,
  gaiaHubUrl,
}: {
  wallet: Wallet;
  gaiaHubUrl: string;
}): Promise<Wallet> {
  const hubInfo = await getHubInfo(gaiaHubUrl);
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
    fetchWalletConfig({ wallet, gaiaHubConfig: currentGaiaConfig }),
    fetchLegacyWalletConfig({ wallet, gaiaHubConfig: legacyGaiaConfig }),
  ]);

  // Restore from existing config
  if (
    walletConfig &&
    walletConfig.accounts.length >= (legacyWalletConfig?.identities.length || 0)
  ) {
    const newAccounts = walletConfig.accounts.map((account, index) => {
      let existingAccount = wallet.accounts[index];
      if (!existingAccount) {
        existingAccount = deriveAccount({
          rootNode,
          index,
          salt: wallet.salt,
        });
      }
      return {
        ...existingAccount,
        username: account.username,
      };
    });

    return {
      ...wallet,
      accounts: newAccounts,
    };
  }

  // Restore from legacy config, and upload a new one
  if (legacyWalletConfig) {
    const newAccounts = legacyWalletConfig.identities.map((identity, index) => {
      let existingAccount = wallet.accounts[index];
      if (!existingAccount) {
        existingAccount = deriveAccount({
          rootNode,
          index,
          salt: wallet.salt,
        });
      }
      return {
        ...existingAccount,
        username: identity.username,
      };
    });

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
