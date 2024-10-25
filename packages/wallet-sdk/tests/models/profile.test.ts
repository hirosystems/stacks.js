import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { makeRandomPrivKey } from '@stacks/transactions';
import fetchMock from 'jest-fetch-mock';
import { TokenVerifier } from 'jsontokens';
import {
  DEFAULT_PROFILE,
  fetchProfileFromUrl,
  signProfileForUpload,
} from '../../src/models/profile';
import { MOCK_PROFILE_RESPONSE, mockAccount } from '../mocks';

describe(signProfileForUpload, () => {
  test('sign with the stx private key', () => {
    const account = mockAccount;
    const profile = DEFAULT_PROFILE;

    const signedProfileString = signProfileForUpload({ profile, account });
    const signedProfileToken = JSON.parse(signedProfileString)[0];

    const tokenVerifierData = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.dataPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierData.verify(signedProfileToken.token)).toEqual(false);
    const tokenVerifierStx = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.stxPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierStx.verify(signedProfileToken.token)).toEqual(true);
  });

  test('sign with the data private key', () => {
    const account = mockAccount;
    account.stxPrivateKey = account.dataPrivateKey;
    const profile = DEFAULT_PROFILE;

    const signedProfileString = signProfileForUpload({ profile, account });
    const signedProfileToken = JSON.parse(signedProfileString)[0];
    const tokenVerifierData = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.dataPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierData.verify(signedProfileToken.token)).toEqual(true);
    const tokenVerifierStx = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.stxPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierStx.verify(signedProfileToken.token)).toEqual(true);
  });

  test('sign with unknown private key', () => {
    const account = mockAccount;
    account.stxPrivateKey = makeRandomPrivKey();
    const profile = DEFAULT_PROFILE;

    const signedProfileString = signProfileForUpload({ profile, account });
    const signedProfileToken = JSON.parse(signedProfileString)[0];
    const tokenVerifierData = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.dataPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierData.verify(signedProfileToken.token)).toEqual(false);
    const tokenVerifierStx = new TokenVerifier(
      'ES256k',
      getPublicKeyFromPrivate(account.stxPrivateKey.slice(0, 64))
    );
    expect(tokenVerifierStx.verify(signedProfileToken.token)).toEqual(true);
  });
});

describe('fetchProfileFromUrl', () => {
  test('profile claim', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(MOCK_PROFILE_RESPONSE));
    const profile = await fetchProfileFromUrl(
      'https://gaia.blockstack.org/hub/1Dvq2tBg8FLeWs5H93Dt5jVfEEiJFa3R8C/profile.json'
    );
    expect(profile).toEqual(MOCK_PROFILE_RESPONSE[0].decodedToken.payload.claim);
  });

  test('404', async () => {
    const profile = await fetchProfileFromUrl('https://gaia.blockstack.org/hub/404');
    expect(profile).toBe(null);
  });
});
