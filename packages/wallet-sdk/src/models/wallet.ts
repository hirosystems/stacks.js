import { StacksNetwork } from '@stacks/network';
import { DerivationType, selectStxDerivation } from '..';
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
  network,
}: {
  wallet: Wallet;
  gaiaHubUrl: string;
  network: StacksNetwork;
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
    const newAccounts = await Promise.all(
      walletConfig.accounts.map(async (account, index) => {
        let existingAccount = wallet.accounts[index];
        const { username, stxDerivationType } = await selectStxDerivation({
          username: account.username,
          rootNode,
          index,
          network,
        });
        if (stxDerivationType === DerivationType.Unknown) {
          // This account index has a username
          // that is not owned by stx derivation path or data derivation path
          // we can't determine the stx private key :-/
          return Promise.reject(`Username ${username} is owned by unknown private key`);
        }
        if (!existingAccount) {
          existingAccount = deriveAccount({
            rootNode,
            index,
            salt: wallet.salt,
            stxDerivationType,
          });
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
      legacyWalletConfig.identities.map(async (identity, index) => {
        let existingAccount = wallet.accounts[index];
        const { username, stxDerivationType } = await selectStxDerivation({
          username: identity.username,
          rootNode,
          index,
          network,
        });
        if (stxDerivationType === DerivationType.Unknown) {
          // This account index has a username
          // that is not owned by stx derivation path or data derivation path
          // we can't determine the stx private key :-/
          return Promise.reject(`Username ${username} is owned by unknown private key`);
        }
        if (!existingAccount) {
          existingAccount = deriveAccount({
            rootNode,
            index,
            salt: wallet.salt,
            stxDerivationType,
          });
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
