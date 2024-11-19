// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  validateMnemonic,
} from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';
import { bytesToHex } from '@stacks/common';
import {
  generateSecretKey,
  generateWallet,
  getAppPrivateKey,
  getGaiaAddress,
  getStxAddress,
} from '../src';

describe(generateSecretKey, () => {
  test('generates a 24 word phrase by default', () => {
    const key = generateSecretKey();
    const words = key.split(' ');
    expect(words.length).toEqual(24);
  });

  test('generates a 12 word seed if 128 bits entropy', () => {
    const key = generateSecretKey(128);
    expect(key.split(' ').length).toEqual(12);
  });

  test('generates a valid mnemonic', () => {
    expect(validateMnemonic(generateSecretKey(), wordlist)).toBeTruthy();
    expect(validateMnemonic(generateSecretKey(128), wordlist)).toBeTruthy();
  });
});

describe(generateWallet, () => {
  test('backwards compatibility test', async () => {
    const secretKey =
      'sound idle panel often situate develop unit text design antenna ' +
      'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
      'update opinion media';

    const wallet = await generateWallet({ secretKey, password: 'password' });

    expect(wallet.salt).toEqual('c15619adafe7e75a195a1a2b5788ca42e585a3fd181ae2ff009c6089de54ed9e');
    expect(wallet.rootKey).toEqual(
      'xprv9s21ZrQH143K2KAnQL9secDrgY84y7bFrxFdtBjASeGwYyCRgDRjuJAbmnUCjRsGX8z7A7ML2Kj91Uv7aWe8n5suV5bUa6mvcysgCx9TGFc'
    );
    expect(wallet.configPrivateKey).toEqual(
      '67e113e8ccf43fc8a724710620cf369f23c34c396c649615c31e1fd9aaf23d72'
    );

    expect(wallet.accounts.length).toEqual(1);
    const [account] = wallet.accounts;
    const appsKey =
      'xprvA1y4zBndD83n6PWgVH6ivkTpNQ2WU1UGPg9hWa2q8sCANa7YrYMZFHWMhrbpsarx' +
      'XMuQRa4jtaT2YXugwsKrjFgn765tUHu9XjyiDFEjB7f';
    expect(account.appsKey).toEqual(appsKey);
    expect(account.stxPrivateKey).toEqual(
      '8721c6a5237f5e8d361161a7855aa56885a3e19e2ea6ee268fb14eabc5e2ed9001'
    );
    expect(account.dataPrivateKey).toEqual(
      'a29c3e73dba79ab0f84cb792bafd65ec71f243ebe67a7ebd842ef5cdce3b21eb'
    );

    expect(getStxAddress({ account, network: 'testnet' })).toEqual(
      'ST384CVPNDTYA0E92TKJZQTYXQHNZSWGCAH0ER64E'
    );
    expect(getStxAddress({ account, network: 'mainnet' })).toEqual(
      'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB'
    );

    expect(getGaiaAddress(account)).toEqual('1JeTQ5cQjsD57YGcsVFhwT7iuQUXJR6BSk');

    expect(getAppPrivateKey({ account, appDomain: 'https://banter.pub' })).toEqual(
      '6f8b6a170f8b2ee57df5ead49b0f4c8acde05f9e1c4c6ef8223d6a42fabfa314'
    );
  });
});

describe('Compatibility verification @scure/bip39 vs bitcoinjs/bip39', () => {
  test('Verify compatibility @scure/bip39 <=> bitcoinjs/bip39', () => {
    // Consider an entropy
    const entropy = '00000000000000000000000000000000';
    // Consider same entropy in array format
    const entropyUint8Array = new Uint8Array(entropy.split('').map(Number));

    // Use vectors to verify result with bitcoinjs/bip39 instead of importing bitcoinjs/bip39
    const bitcoinjsBip39 = {
      // Consider it equivalent to bitcoinjs/bip39 (offloaded now)
      // Using this map of required functions from bitcoinjs/bip39 and mocking the output for considered entropy
      entropyToMnemonicBip39: (_: string) =>
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      validateMnemonicBip39: (_: string) => true,
      mnemonicToEntropyBip39: (_: string) => '00000000000000000000000000000000',
    };

    // entropyToMnemonicBip39 imported from bitcoinjs/bip39
    const bip39Mnemonic = bitcoinjsBip39.entropyToMnemonicBip39(entropy);
    // entropyToMnemonic imported from @scure/bip39
    const mnemonic = entropyToMnemonic(entropyUint8Array, wordlist);

    //Phase 1: Cross verify mnemonic validity: @scure/bip39 <=> bitcoinjs/bip39

    // validateMnemonic imported from @scure/bip39
    expect(validateMnemonic(bip39Mnemonic, wordlist)).toEqual(true);
    // validateMnemonicBip39 imported from bitcoinjs/bip39
    expect(bitcoinjsBip39.validateMnemonicBip39(mnemonic)).toEqual(true);

    // validateMnemonic imported from @scure/bip39
    expect(validateMnemonic(mnemonic, wordlist)).toEqual(true);
    // validateMnemonicBip39 imported from bitcoinjs/bip39
    expect(bitcoinjsBip39.validateMnemonicBip39(bip39Mnemonic)).toEqual(true);

    //Phase 2: Get back entropy from mnemonic and verify @scure/bip39 <=> bitcoinjs/bip39

    // mnemonicToEntropy imported from @scure/bip39
    expect(mnemonicToEntropy(mnemonic, wordlist)).toEqual(entropyUint8Array);
    // mnemonicToEntropyBip39 imported from bitcoinjs/bip39
    expect(bitcoinjsBip39.mnemonicToEntropyBip39(bip39Mnemonic)).toEqual(entropy);
    // mnemonicToEntropy imported from @scure/bip39
    expect(bytesToHex(mnemonicToEntropy(bip39Mnemonic, wordlist))).toEqual(entropy);
    // mnemonicToEntropyBip39 imported from bitcoinjs/bip39
    const entropyString = bitcoinjsBip39.mnemonicToEntropyBip39(mnemonic);
    // Convert entropy to bytes
    const entropyInBytes = new Uint8Array(entropyString.split('').map(Number));
    // entropy should match with entropyUint8Array
    expect(entropyInBytes).toEqual(entropyUint8Array);
  });

  test('Seed verification @scure/bip39 <=> bitcoinjs/bip39', async () => {
    // Consider an entropy as actually generated by calling generateMnemonic(wordlist)
    const mnemonic =
      'limb basket cactus metal come display chicken brief execute version attract journey';
    const seed = await mnemonicToSeed(mnemonic);
    // Use vectors to verify result with bitcoinjs/bip39 instead of importing bitcoinjs/bip39
    const bitcoinjsBip39 = {
      // Consider it equivalent to bitcoinjs/bip39 (offloaded now)
      // Using this map of required functions from bitcoinjs/bip39 and mocking the output for considered entropy
      mnemonicToSeedBip39: (_: string) =>
        '8f157914f06a56abf3a188c9a96faa74100e34d30aff7a6bafe8af33d5c398ef703759e30654f536a2241dc88a5fd3d963b743153b450c91dcfc0ab9f3d90256',
    };
    expect(bytesToHex(seed)).toEqual(bitcoinjsBip39.mnemonicToSeedBip39(mnemonic));
  });
});
