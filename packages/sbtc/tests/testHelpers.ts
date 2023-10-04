import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import * as btc from '@scure/btc-signer';
import { REGTEST } from '../src';
import {
  DerivationType,
  deriveAccount,
  generateNewAccount,
  generateWallet,
  getRootNode,
  getStxAddress,
} from '@stacks/wallet-sdk';
import { TransactionVersion } from '@stacks/transactions';

export const WALLET_01 =
  'sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild';
export const WALLET_02 =
  'hold excess usual excess ring elephant install account glad dry fragile donkey gaze humble truck breeze nation gasp vacuum limb head keep delay hospital';

export async function getBitcoinAccount(mnemonic: string, idx: number = 0) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed, REGTEST.bip32);

  const path = `m/84'/${REGTEST.bip84.coin}'/${idx}'/0/0`;

  const privateKey = hdkey.derive(path).privateKey!;
  const address = btc.getAddress('wpkh', privateKey, REGTEST)!;

  return { privateKey, address };
}

export async function getStacksAccount(mnemonic: string, idx: number = 0) {
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: '',
  });

  const account = deriveAccount({
    rootNode: getRootNode(wallet),
    index: idx,
    salt: wallet.salt,
    stxDerivationType: DerivationType.Wallet,
  });

  return {
    ...account,
    address: getStxAddress({ account, transactionVersion: TransactionVersion.Testnet }),
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
