import { validateMnemonic } from 'bip39';
import {
  generateSecretKey,
  generateWallet,
  getGaiaAddress,
  getStxAddress,
  getAppPrivateKey,
} from '../src';
import { TransactionVersion } from '@stacks/transactions';

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
    expect(validateMnemonic(generateSecretKey())).toBeTruthy();
    expect(validateMnemonic(generateSecretKey(128))).toBeTruthy();
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

    expect(getStxAddress({ account, transactionVersion: TransactionVersion.Testnet })).toEqual(
      'ST384CVPNDTYA0E92TKJZQTYXQHNZSWGCAH0ER64E'
    );
    expect(getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet })).toEqual(
      'SP384CVPNDTYA0E92TKJZQTYXQHNZSWGCAG7SAPVB'
    );

    expect(getGaiaAddress(account)).toEqual('1JeTQ5cQjsD57YGcsVFhwT7iuQUXJR6BSk');

    expect(getAppPrivateKey({ account, appDomain: 'https://banter.pub' })).toEqual(
      '6f8b6a170f8b2ee57df5ead49b0f4c8acde05f9e1c4c6ef8223d6a42fabfa314'
    );
  });
});
