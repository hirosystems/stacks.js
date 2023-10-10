import { ProjectivePoint } from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import * as btc from '@scure/btc-signer';
import { TransactionVersion } from '@stacks/transactions';
import {
  DerivationType,
  deriveAccount,
  generateWallet,
  getRootNode,
  getStxAddress,
} from '@stacks/wallet-sdk';
import { REGTEST } from '../../src';

export const WALLET_00 =
  'twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw';
export const WALLET_01 =
  'sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild';
export const WALLET_02 =
  'hold excess usual excess ring elephant install account glad dry fragile donkey gaze humble truck breeze nation gasp vacuum limb head keep delay hospital';

export async function getBitcoinAccount(mnemonic: string, idx: number = 0, network = REGTEST) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed, network.bip32);

  const path = `m/84'/${network.bip84.coin}'/${idx}'/0/0`;
  const privateKey = hdkey.derive(path).privateKey!;
  const publicKey = hdkey.derive(path).publicKey!;

  const trPath = `m/86'/${network.bip84.coin}'/${idx}'/0/0`;
  const trPrivateKey = hdkey.derive(trPath).privateKey!;
  const trPublicKey = hdkey.derive(trPath).publicKey!; // not sure if this should be used, but this is what the CLI returns

  return {
    privateKey,
    publicKey,
    wpkh: { address: btc.getAddress('wpkh', privateKey, network)! },
    tr: {
      address: btc.getAddress('tr', trPrivateKey, network)!,
      publicKey: trPublicKey,
    },
  };
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

export function schnorrPublicKey(privateKey: Uint8Array) {
  return ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true).slice(1);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
