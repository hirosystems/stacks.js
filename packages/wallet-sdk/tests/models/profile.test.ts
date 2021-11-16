import { getPublicKeyFromPrivate } from "@stacks/encryption";
import { getAddressFromPrivateKey } from "@stacks/transactions";
import { TokenVerifier } from "jsontokens";
import { DEFAULT_PROFILE, selectPrivateKey, signProfileForUpload } from "../../src/models/profile";
import { mockAccount } from "../mocks";
import fetchMock from 'jest-fetch-mock';

describe(signProfileForUpload, () => {
  test('sign with the stx private key', () => {
    const account = mockAccount;
    const profile = DEFAULT_PROFILE

    const signedProfileString = signProfileForUpload({
      profile, profilePrivateKey: account.stxPrivateKey
    });    
    const signedProfileToken = JSON.parse(signedProfileString)[0]

    const tokenVerifierData = new TokenVerifier('ES256k', getPublicKeyFromPrivate(account.dataPrivateKey.slice(0,64)));      
    expect(tokenVerifierData.verify(signedProfileToken.token)).toEqual(false);
    const tokenVerifierStx = new TokenVerifier('ES256k', getPublicKeyFromPrivate(account.stxPrivateKey.slice(0,64)));      
    expect(tokenVerifierStx.verify(signedProfileToken.token)).toEqual(true);
  });


  test('sign with the data private key', () => {
    const account = mockAccount;
    const profile = DEFAULT_PROFILE

    const signedProfileString = signProfileForUpload({
      profile, profilePrivateKey: account.dataPrivateKey
    });    
    const signedProfileToken = JSON.parse(signedProfileString)[0]
    const tokenVerifierData = new TokenVerifier('ES256k', getPublicKeyFromPrivate(account.dataPrivateKey.slice(0,64)));      
    expect(tokenVerifierData.verify(signedProfileToken.token)).toEqual(true);
    const tokenVerifierStx = new TokenVerifier('ES256k', getPublicKeyFromPrivate(account.stxPrivateKey.slice(0,64)));      
    expect(tokenVerifierStx.verify(signedProfileToken.token)).toEqual(false);
  });

});

describe(selectPrivateKey, () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('select without username', async () => {
    const account = mockAccount;
    account.username = undefined;

    const profilePrivateKey = selectPrivateKey(account);
    expect(profilePrivateKey).toEqual(account.stxPrivateKey);
 });

 test('select without username but usernameOwnerAddress', async () => {
  const account = mockAccount;
  account.username = undefined;
  account.usernameOwnerAddress = getAddressFromPrivateKey(account.dataPrivateKey);
  const profilePrivateKey = selectPrivateKey(account);
  expect(profilePrivateKey).toEqual(account.stxPrivateKey);
});

  test('select with username owned by stx private key', async () => {
    const account = mockAccount;
    account.username = "test.btc";
    account.usernameOwnerAddress = getAddressFromPrivateKey(account.stxPrivateKey);
    const profilePrivateKey = selectPrivateKey(account);
    expect(profilePrivateKey).toEqual(account.stxPrivateKey);
  });

  test('select with username owned by data private key', async () => {
    const account = mockAccount;
    account.username = "test.btc";
    account.usernameOwnerAddress = getAddressFromPrivateKey(account.dataPrivateKey);
    const profilePrivateKey = selectPrivateKey(account);
    expect(profilePrivateKey).toEqual(account.dataPrivateKey);
  });
});
