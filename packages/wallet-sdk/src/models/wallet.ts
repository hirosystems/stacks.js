import { StacksNetwork } from '@stacks/network';
import {
  DerivationType,
  deriveDataPrivateKey,
  deriveStxPrivateKey,
  selectDerivationType,
} from '..';
import { deriveAccount, deriveLegacyConfigPrivateKey } from '../derive';
import { fetchFirstName } from '../usernames';
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
        let username = account.username;
        let stxDerivationType = DerivationType.Wallet;
        if (username) {
          // Based on username, determine the derivation path for the stx private key
          const stxDerivationTypeForUsername = await selectDerivationType({
            username,
            rootNode,
            index,
            network,
          });
          stxDerivationType = stxDerivationTypeForUsername;
        } else {
          // try to find existing usernames owned by stx derivation path
          const address = deriveStxPrivateKey({ rootNode, index });
          username = await fetchFirstName(address, network);
          if (!username) {
            // try to find existing usernames owned by data derivation path
            const address = deriveDataPrivateKey({ rootNode, index });
            username = await fetchFirstName(address, network);
            if (username) {
              stxDerivationType = DerivationType.Data;
            }
          }
        }
        if (!existingAccount) {
          if (stxDerivationType === DerivationType.Unknown) {
            // TODO this account index has a username
            // that is not owned by stx derivation path or data derivation path
            // we can't determine the stx private key :-/
          } else {
            existingAccount = deriveAccount({
              rootNode,
              index,
              salt: wallet.salt,
              stxDerivationType,
            });
          }
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
        let stxDerivationType = DerivationType.Wallet;
        if (identity.username) {
          const stxDerivationTypeForUsername = await selectDerivationType({
            username: identity.username,
            rootNode,
            index,
            network,
          });
          if (stxDerivationTypeForUsername === DerivationType.Unknown) {
            delete identity.username;
          } else {
            stxDerivationType = stxDerivationTypeForUsername;
          }
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
          username: identity.username,
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
