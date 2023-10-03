import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import { REGTEST } from '../src';

export const WALLET_00 =
  'twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw';
export const WALLET_01 =
  'sell invite acquire kitten bamboo drastic jelly vivid peace spawn twice guilt pave pen trash pretty park cube fragile unaware remain midnight betray rebuild';

export function getBitcoinAccount(mnemonic: string, idx: number = 0) {
  const hdkey = HDKey.fromMasterSeed(hexToBytes(mnemonic), REGTEST.bip32);

  const path = `m/84'/${REGTEST.bip84.coin}'/${idx}'/0/0`;

  const privateKey = hdkey.derive(path).privateKey!;
  const address = btc.getAddress('wpkh', privateKey, REGTEST)!;

  return { privateKey, address };
}
