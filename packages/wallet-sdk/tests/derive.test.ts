import {
  deriveWalletKeys,
  deriveAccount,
  getStxAddress,
  deriveLegacyConfigPrivateKey,
  DerivationType,
} from '../src';
import { mnemonicToSeed } from 'bip39';
import { fromBase58, fromSeed } from 'bip32';
import { TransactionVersion } from '@stacks/transactions';

test('keys are serialized, and can be deserialized properly using wallet private key for stx', async () => {
  const secretKey =
    'sound idle panel often situate develop unit text design antenna ' +
    'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
    'update opinion media';
  const rootPrivateKey = await mnemonicToSeed(secretKey);
  const rootNode1 = fromSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = fromBase58(derived.rootKey);
  const account = deriveAccount({ rootNode, index: 0, salt: derived.salt, stxDerivationType: DerivationType.Wallet });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB'
  );
});


test('keys are serialized, and can be deserialized properly using data private key for stx', async () => {
  const secretKey =
    'sound idle panel often situate develop unit text design antenna ' +
    'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
    'update opinion media';
  const rootPrivateKey = await mnemonicToSeed(secretKey);
  const rootNode1 = fromSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = fromBase58(derived.rootKey);
  const account = deriveAccount({ rootNode, index: 0, salt: derived.salt, stxDerivationType: DerivationType.Data });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    'SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K'
  );
});

test('backwards compatible legacy config private key derivation', async () => {
  const secretKey =
    'sound idle panel often situate develop unit text design antenna ' +
    'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
    'update opinion media';
  const rootPrivateKey = await mnemonicToSeed(secretKey);
  const rootNode = fromSeed(rootPrivateKey);
  const legacyKey = deriveLegacyConfigPrivateKey(rootNode);
  expect(legacyKey).toEqual('767b51d866d068b02ce126afe3737896f4d0c486263d9b932f2822109565a3c6');
});
