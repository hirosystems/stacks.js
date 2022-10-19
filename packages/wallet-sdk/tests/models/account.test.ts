import { decryptPrivateKey } from '@stacks/auth';
import {
  getPublicKeyFromPrivate,
  makeECPrivateKey,
  publicKeyToBtcAddress,
} from '@stacks/encryption';
import fetchMock from 'jest-fetch-mock';
import { decodeToken } from 'jsontokens';
import { getAppPrivateKey, getGaiaAddress, makeAuthResponse } from '../../src';
import { mockAccount, mockGaiaHubInfo } from '../mocks';

beforeEach(() => {
  fetchMock.resetMocks();
  jest.resetModules();
});

interface Decoded {
  [key: string]: any;
}

const gaiaHubUrl = 'https://hub.blockstack.org';

test('generates the correct app private key', () => {
  const expectedKey = '6f8b6a170f8b2ee57df5ead49b0f4c8acde05f9e1c4c6ef8223d6a42fabfa314';
  const appPrivateKey = getAppPrivateKey({ account: mockAccount, appDomain: 'https://banter.pub' });
  expect(appPrivateKey).toEqual(expectedKey);
});

describe(makeAuthResponse, () => {
  test('generates an auth response', async () => {
    const account = mockAccount;
    const appDomain = 'https://banter.pub';
    const transitPrivateKey = makeECPrivateKey();
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);

    fetchMock.once(mockGaiaHubInfo).once('', { status: 404 });

    const authResponse = await makeAuthResponse({
      appDomain,
      gaiaHubUrl,
      transitPublicKey,
      account,
    });

    const decoded = decodeToken(authResponse);
    const { payload } = decoded as Decoded;
    expect(payload.profile_url).toEqual(
      `https://gaia.blockstack.org/hub/${getGaiaAddress(account)}/profile.json`
    );
    const appPrivateKey = await decryptPrivateKey(transitPrivateKey, payload.private_key);
    const expectedKey = '6f8b6a170f8b2ee57df5ead49b0f4c8acde05f9e1c4c6ef8223d6a42fabfa314';
    expect(appPrivateKey).toEqual(expectedKey);
  });

  test('adds to apps in profile if publish_data scope', async () => {
    const account = mockAccount;
    const appDomain = 'https://banter.pub';
    const transitPrivateKey = makeECPrivateKey();
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);

    fetchMock
      .once(mockGaiaHubInfo)
      .once('', { status: 404 }) // fetch existing profile
      .once(JSON.stringify({ publicUrl: 'asdf' })); // Upload profile

    const authResponse = await makeAuthResponse({
      appDomain,
      gaiaHubUrl,
      transitPublicKey,
      account,
      scopes: ['publish_data'],
    });
    expect(fetchMock.mock.calls.length).toEqual(3);

    const decoded = decodeToken(authResponse);
    const { payload } = decoded as Decoded;
    expect(payload.profile.apps['https://banter.pub']).toEqual(
      'https://gaia.blockstack.org/hub/1DkuAChufYjTkTCejJgSztuqp5KdykpWap/'
    );

    const [uploadUrl, uploadRequest] = fetchMock.mock.calls[2];
    if (!uploadRequest) throw 'Expected to upload profile';
    expect(uploadUrl).toEqual(
      `https://hub.blockstack.org/store/${getGaiaAddress(account)}/profile.json`
    );

    const profile = JSON.parse(uploadRequest.body as string);
    const { apps, appsMeta } = profile[0].decodedToken.payload.claim;
    expect(apps[appDomain]).not.toBeFalsy();

    const appPrivateKey = await decryptPrivateKey(transitPrivateKey, payload.private_key);
    expect(appPrivateKey).not.toBeNull();

    const publicKey = getPublicKeyFromPrivate(appPrivateKey!);
    const address = publicKeyToBtcAddress(publicKey);
    const expectedDomain = `https://gaia.blockstack.org/hub/${address}/`;
    expect(apps[appDomain]).toEqual(expectedDomain);
    expect(appsMeta[appDomain]).not.toBeFalsy();
    expect(appsMeta[appDomain].storage).toEqual(expectedDomain);
    expect(appsMeta[appDomain].publicKey).toEqual(publicKey);
  });

  test('generates an auth response with appPrivateKeyFromWalletSalt', async () => {
    const account = mockAccount;
    const appDomain = 'https://banter.pub';
    const transitPrivateKey = makeECPrivateKey();
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
    const appPrivateKeyFromWalletSalt =
      'ab9a2ad092b910902f4a74f7aeaee874497ed9bc3f6408ed8b07e22425471fde';

    fetchMock.once(mockGaiaHubInfo).once('', { status: 404 });

    const authResponse = await makeAuthResponse({
      appDomain,
      gaiaHubUrl,
      transitPublicKey,
      account,
      appPrivateKeyFromWalletSalt,
    });

    const decoded = decodeToken(authResponse);
    const { payload } = decoded as Decoded;
    expect(payload.profile_url).toEqual(
      `https://gaia.blockstack.org/hub/${getGaiaAddress(account)}/profile.json`
    );
    const appPrivateKey = await decryptPrivateKey(transitPrivateKey, payload.private_key);
    const expectedKey = '6f8b6a170f8b2ee57df5ead49b0f4c8acde05f9e1c4c6ef8223d6a42fabfa314';
    expect(appPrivateKey).toEqual(expectedKey);
    expect(payload.appPrivateKeyFromWalletSalt).toEqual(appPrivateKeyFromWalletSalt);
  });
});
