import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { makeRandomPrivKey, privateKeyToString } from '@stacks/transactions';
import { TokenVerifier } from 'jsontokens';
import { DEFAULT_PROFILE, signProfileForUpload } from '../../src/models/profile';
import { mockAccount } from '../mocks';

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
    account.stxPrivateKey = privateKeyToString(makeRandomPrivKey());
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
