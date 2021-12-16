import {
  deriveWalletKeys,
  deriveAccount,
  getStxAddress,
  deriveLegacyConfigPrivateKey,
  DerivationType,
  selectStxDerivation,
  fetchUsernameForAccountByDerivationType,
} from '../src';
// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import { mnemonicToSeed } from '@scure/bip39';
import { BIP32Interface, fromBase58 } from 'bip32';
import { HDKey } from '@scure/bip32';
import { TransactionVersion } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';
import { bytesToHex } from '@stacks/common';

const SECRET_KEY =
  'sound idle panel often situate develop unit text design antenna ' +
  'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
  'update opinion media';
const WALLET_ADDRESS = 'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB';
const DATA_ADDRESS = 'SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K';

test('keys are serialized, and can be deserialized properly using wallet private key for stx', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode1 = HDKey.fromMasterSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = HDKey.fromExtendedKey(derived.rootKey);
  const account = deriveAccount({
    rootNode,
    index: 0,
    salt: derived.salt,
    stxDerivationType: DerivationType.Wallet,
  });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    WALLET_ADDRESS
  );
});

test('keys are serialized, and can be deserialized properly using data private key for stx', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode1 = HDKey.fromMasterSeed(rootPrivateKey);
  const derived = await deriveWalletKeys(rootNode1);
  const rootNode = HDKey.fromExtendedKey(derived.rootKey);
  const account = deriveAccount({
    rootNode,
    index: 0,
    salt: derived.salt,
    stxDerivationType: DerivationType.Data,
  });
  expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
    DATA_ADDRESS
  );
});

test('backwards compatible legacy config private key derivation', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const legacyKey = deriveLegacyConfigPrivateKey(rootNode);
  expect(legacyKey).toEqual('767b51d866d068b02ce126afe3737896f4d0c486263d9b932f2822109565a3c6');
});

test('derive derivation path without username', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();
  const { username, stxDerivationType } = await selectStxDerivation({
    username: undefined,
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual(undefined);
  expect(stxDerivationType).toEqual(DerivationType.Wallet);
});

test('derive derivation path with username owned by address of stx derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock.once(JSON.stringify({ address: DATA_ADDRESS }));

  const { username, stxDerivationType } = await selectStxDerivation({
    username: 'public_profile_for_testing.id.blockstack',
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Data);
});

test('derive derivation path with username owned by address of unknown derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock.once(JSON.stringify({ address: 'SP000000000000000000002Q6VF78' }));

  const { username, stxDerivationType } = await selectStxDerivation({
    username: 'public_profile_for_testing.id.blockstack',
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Unknown);
});

test('derive derivation path with username owned by address of data derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock.once(JSON.stringify({ address: 'SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K' }));

  const { username, stxDerivationType } = await selectStxDerivation({
    username: 'public_profile_for_testing.id.blockstack',
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Data);
});

test('derive derivation path with new username owned by address of stx derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock.once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }));

  const { username, stxDerivationType } = await selectStxDerivation({
    username: undefined,
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Wallet);
  expect(fetchMock.mock.calls[0][0]).toEqual(
    `https://stacks-node-api.mainnet.stacks.co/v1/addresses/stacks/${WALLET_ADDRESS}`
  );
});

test('derive derivation path with new username owned by address of data derivation path', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const network = new StacksMainnet();

  fetchMock
    .once(JSON.stringify({ names: [] })) // no names on stx derivation path
    .once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }));

  const { username, stxDerivationType } = await selectStxDerivation({
    username: undefined,
    rootNode,
    index: 0,
    network,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Data);
  expect(fetchMock.mock.calls[0][0]).toEqual(
    `https://stacks-node-api.mainnet.stacks.co/v1/addresses/stacks/${WALLET_ADDRESS}`
  );
  expect(fetchMock.mock.calls[1][0]).toEqual(
    `https://stacks-node-api.mainnet.stacks.co/v1/addresses/stacks/${DATA_ADDRESS}`
  );
});

test('derive derivation path with username and without network', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  const { username, stxDerivationType } = await selectStxDerivation({
    username: 'public_profile_for_testing.id.blockstack',
    rootNode,
    index: 0,
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
  expect(stxDerivationType).toEqual(DerivationType.Unknown);
});

test('derive derivation path without username and without network', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  const { username, stxDerivationType } = await selectStxDerivation({
    username: undefined,
    rootNode,
    index: 0,
  });
  expect(username).toEqual(undefined);
  expect(stxDerivationType).toEqual(DerivationType.Wallet);
});

test('fetch username owned by derivation type', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  fetchMock.once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }));

  const { username } = await fetchUsernameForAccountByDerivationType({
    rootNode,
    index: 0,
    derivationType: DerivationType.Wallet,
    network: new StacksMainnet(),
  });
  expect(username).toEqual('public_profile_for_testing.id.blockstack');
});

test('fetch username owned by different derivation type', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  fetchMock.once(JSON.stringify({ names: [] }));

  const { username } = await fetchUsernameForAccountByDerivationType({
    rootNode,
    index: 0,
    derivationType: DerivationType.Wallet,
    network: new StacksMainnet(),
  });
  expect(username).toEqual(undefined);
});

test('fetch username defaults to mainnet', async () => {
  const rootPrivateKey = await mnemonicToSeed(SECRET_KEY);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);

  fetchMock.once(JSON.stringify({ names: ['public_profile_for_testing.id.blockstack'] }));

  await fetchUsernameForAccountByDerivationType({
    rootNode,
    index: 0,
    derivationType: DerivationType.Wallet,
  });
  expect(fetchMock.mock.calls[0][0]).toContain('stacks-node-api.mainnet');
});

test('Verify compatibility between @scure/bip32 and bip32 dependency', () => {
  // Consider a root key in base58 format
  const root =
    'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi';
  const bip32Node: BIP32Interface = fromBase58(root);

  // Use same root key to create node using @scure/bip32
  const keychainNode = HDKey.fromExtendedKey(root);

  if (bip32Node.privateKey && keychainNode.privateKey) {
    expect(bip32Node.privateKey.toString('hex')).toEqual(bytesToHex(keychainNode.privateKey));
  } else {
    // Reject test case
    fail(
      'No private keys: failed to verify compatibility between @scure/bip32 and bip32 dependency'
    );
  }

  const derivationPath = 'm/0/0';

  // Derive a child from bip32Node at given derivation path
  const childBip32Node: BIP32Interface = bip32Node.derivePath(derivationPath);

  // Derive a child from keychainNode at given derivation path
  const childKeychainNode = keychainNode.derive(derivationPath);

  if (childBip32Node.privateKey && childKeychainNode.privateKey) {
    expect(childBip32Node.privateKey.toString('hex')).toEqual(
      bytesToHex(childKeychainNode.privateKey)
    );
  } else {
    // Reject test case
    fail(
      'No private keys: failed to verify compatibility between @scure/bip32 and bip32 dependency'
    );
  }
});
