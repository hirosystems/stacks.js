import {
  deriveWalletKeys,
  deriveAccount,
  getStxAddress,
  deriveLegacyConfigPrivateKey,
  DerivationType,
  selectStxDerivation,
} from '../src';
import { mnemonicToSeed } from 'bip39';
import { fromBase58, fromSeed } from 'bip32';
import { TransactionVersion } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';

const SECRET_KEY =
  'sound idle panel often situate develop unit text design antenna ' +
  'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
  'update opinion media';
const WALLET_ADDRESS = 'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB'
const DATA_ADDRESS = 'SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K';

test('keys are serialized, and can be deserialized properly using wallet private key for stx', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode1 = fromSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = fromBase58(derived.rootKey);
  const account = deriveAccount({ rootNode, index: 0, salt: derived.salt, stxDerivationType: DerivationType.Wallet });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    WALLET_ADDRESS
  );
});


test('keys are serialized, and can be deserialized properly using data private key for stx', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode1 = fromSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = fromBase58(derived.rootKey);
  const account = deriveAccount({ rootNode, index: 0, salt: derived.salt, stxDerivationType: DerivationType.Data });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    DATA_ADDRESS
  );
});

test('backwards compatible legacy config private key derivation', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const legacyKey = deriveLegacyConfigPrivateKey(rootNode);
  expect(legacyKey).toEqual('767b51d866d068b02ce126afe3737896f4d0c486263d9b932f2822109565a3c6');
});


test('derive derivation path without username', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();
  const { username, stxDerivationType } = await selectStxDerivation({ username: undefined, rootNode, index: 0, network });
  expect(username).toEqual(undefined);
  expect(stxDerivationType).toEqual(DerivationType.Wallet);
})



test('derive derivation path with username owned by address of stx derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ address: DATA_ADDRESS }))

  const { username, stxDerivationType } = await selectStxDerivation({ username: "public_profile_for_testing.id.blockstack", rootNode, index: 0, network });
  expect(username).toEqual("public_profile_for_testing.id.blockstack");
  expect(stxDerivationType).toEqual(DerivationType.Data);
})


test('derive derivation path with username owned by address of unknown derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ address: "SP000000000000000000002Q6VF78" }))

  const { username, stxDerivationType } = await selectStxDerivation({ username: "public_profile_for_testing.id.blockstack", rootNode, index: 0, network });
  expect(username).toEqual("public_profile_for_testing.id.blockstack");
  expect(stxDerivationType).toEqual(DerivationType.Unknown);
})


test('derive derivation path with username owned by address of data derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ address: "SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K" }))

  const { username, stxDerivationType } = await selectStxDerivation({ username: "public_profile_for_testing.id.blockstack", rootNode, index: 0, network });
  expect(username).toEqual("public_profile_for_testing.id.blockstack");
  expect(stxDerivationType).toEqual(DerivationType.Data);
})

test('derive derivation path with new username owned by address of stx derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ names: ["public_profile_for_testing.id.blockstack"] }))

  const { username, stxDerivationType } = await selectStxDerivation({ username: undefined, rootNode, index: 0, network });
  expect(username).toEqual("public_profile_for_testing.id.blockstack");
  expect(stxDerivationType).toEqual(DerivationType.Wallet);
})



test('derive derivation path with new username owned by address of data derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = fromSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ names: [] })) // no names on stx derivation path
    .once(JSON.stringify({ names: ["public_profile_for_testing.id.blockstack"] }))

  const { username, stxDerivationType } = await selectStxDerivation({ username: undefined, rootNode, index: 0, network });
  expect(username).toEqual("public_profile_for_testing.id.blockstack");
  expect(stxDerivationType).toEqual(DerivationType.Data);
})
