import { ProjectivePoint } from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import * as btc from '@scure/btc-signer';
import { bytesToHex } from '@stacks/common';
import { STACKS_MAINNET } from '@stacks/network';
import { compressPrivateKey, privateKeyToAddress } from '@stacks/transactions';
import { MAINNET } from '../../src';

export function schnorrPublicKey(privateKey: Uint8Array) {
  return ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true).slice(1);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const WALLET_00 =
  'twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw';
export const WALLET_01 =
  'sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild';
export const WALLET_02 =
  'hold excess usual excess ring elephant install account glad dry fragile donkey gaze humble truck breeze nation gasp vacuum limb head keep delay hospital';

export async function getBitcoinAccount(mnemonic: string, idx: number = 0, network = MAINNET) {
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

export async function getStacksAccount(
  mnemonic: string,
  idx: number = 0,
  network = STACKS_MAINNET
) {
  const rootPrivateKey = await bip39.mnemonicToSeed(mnemonic);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  const childKey = rootNode.derive(`m/44'/5757'/0'/0`).deriveChild(idx);
  const stxPrivateKey = compressPrivateKey(bytesToHex(childKey.privateKey!));

  return {
    /** Alias for `privateKey` @deprecated use `.privateKey` instead */
    stxPrivateKey,
    privateKey: stxPrivateKey,
    address: privateKeyToAddress(stxPrivateKey, network),
  };
}
