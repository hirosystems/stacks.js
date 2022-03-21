import { decodeToken, TokenSigner } from 'jsontokens';

import {
  makeAuthResponse,
  verifyAuthRequest,
  verifyAuthResponse,
  isExpirationDateValid,
  isIssuanceDateValid,
  doSignaturesMatchPublicKeys,
  doPublicKeysMatchIssuer,
  doPublicKeysMatchUsername,
  isManifestUriValid,
  isRedirectUriValid,
  verifyAuthRequestAndLoadManifest,
  UserSession,
  AppConfig,
  makeDIDFromAddress,
  lookupProfile,
} from '../src';

import { makeECPrivateKey, getPublicKeyFromPrivate, publicKeyToAddress } from '@stacks/encryption';

import { sampleProfiles, sampleNameRecords, sampleTokenFiles } from './sampleData';

import fetchMock from 'jest-fetch-mock';

beforeEach(() => {
  fetchMock.resetMocks();
});

const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69';
const nameLookupURL = 'https://stacks-node-api.mainnet.stacks.co/v1/names/';

test('makeAuthRequest && verifyAuthRequest', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });

  const authRequest = blockstack.makeAuthRequest(privateKey);
  expect(authRequest).toBeTruthy();

  const decodedToken = decodeToken(authRequest);
  expect(decodedToken).toBeTruthy();

  const address = publicKeyToAddress(publicKey);
  const referenceDID = makeDIDFromAddress(address);
  const origin = 'http://localhost:3000';
  expect((decodedToken.payload as any).iss).toEqual(referenceDID);
  expect((decodedToken.payload as any).domain_name).toEqual(origin);
  expect((decodedToken.payload as any).redirect_uri).toEqual('http://localhost:3000');
  expect((decodedToken.payload as any).manifest_uri).toEqual('http://localhost:3000/manifest.json');
  expect(JSON.stringify((decodedToken.payload as any).scopes)).toEqual('["store_write"]');

  await verifyAuthRequest(authRequest).then(verified => {
    expect(verified).toBe(true);
  });

  expect(isExpirationDateValid(authRequest)).toBe(true);
  expect(isIssuanceDateValid(authRequest)).toBe(true);
  expect(doSignaturesMatchPublicKeys(authRequest)).toBe(true);
  expect(doPublicKeysMatchIssuer(authRequest)).toBe(true);
  expect(isManifestUriValid(authRequest)).toBe(true);
  expect(isRedirectUriValid(authRequest)).toBe(true);

  const manifiestUrl = 'http://localhost:3000/manifest.json';
  const manifest = {
    name: 'App',
    start_url: 'http://localhost:3000/',
    description: 'A simple todo app build on blockstack',
    icons: [
      {
        src: 'http://localhost:3000/logo.png',
        sizes: '400x400',
        type: 'image/png',
      },
    ],
  };
  const manifestString = JSON.stringify(manifest);
  fetchMock.once(manifestString);

  await verifyAuthRequestAndLoadManifest(authRequest).then(appManifest => {
    expect(appManifest.name).toEqual('App');
  });

  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(fetchMock.mock.calls[0][0]).toEqual(manifiestUrl);
});

test('make and verify auth request with extraParams', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });

  const authRequest = blockstack.makeAuthRequest(
    privateKey,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { myCustomParam: 'asdf' }
  );
  expect(authRequest).toBeTruthy();

  const decodedToken = decodeToken(authRequest);
  expect(decodedToken).toBeTruthy();

  expect((decodedToken.payload as any).myCustomParam).toEqual('asdf');

  await verifyAuthRequest(authRequest).then(verified => {
    expect(verified).toBe(true);
  });
});

test('invalid auth request - signature not verified', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });

  const authRequest = blockstack.makeAuthRequest(privateKey);
  const invalidAuthRequest = authRequest.substring(0, authRequest.length - 1);

  expect(doSignaturesMatchPublicKeys(invalidAuthRequest)).toEqual(false);

  await verifyAuthRequest(invalidAuthRequest).then(verified => {
    expect(verified).toEqual(false);
  });

  const pass = jest.fn();

  await verifyAuthRequestAndLoadManifest(invalidAuthRequest).then(() => {
    // no op
  }, pass);

  expect(pass).toHaveBeenCalled();
});

test('invalid auth request - invalid redirect uri', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  appConfig.redirectURI = () => 'https://example.com'; // monkey patch for test
  const blockstack = new UserSession({ appConfig });

  const invalidAuthRequest = blockstack.makeAuthRequest(privateKey);
  expect(isRedirectUriValid(invalidAuthRequest)).toBe(false);

  await verifyAuthRequest(invalidAuthRequest).then(verified => {
    expect(verified).toBe(false);
  });

  const pass = jest.fn();
  await verifyAuthRequestAndLoadManifest(invalidAuthRequest).then(() => {
    // no op
  }, pass);

  expect(pass).toHaveBeenCalled();
});

test('invalid auth request - invalid manifest uri', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  appConfig.manifestURI = () => 'https://example.com/manifest.json'; // monkey patch for test
  const blockstack = new UserSession({ appConfig });
  const invalidAuthRequest = blockstack.makeAuthRequest(privateKey);

  expect(isManifestUriValid(invalidAuthRequest)).toBe(false);

  await verifyAuthRequest(invalidAuthRequest).then(verified => {
    expect(verified).toBe(false);
  });
});

test('makeAuthResponse && verifyAuthResponse', async () => {
  const authResponse = await makeAuthResponse(privateKey, sampleProfiles.ryan, null, null);
  expect(authResponse).toBeTruthy();

  const decodedToken = decodeToken(authResponse);

  expect(decodedToken).toBeTruthy();

  const address = publicKeyToAddress(publicKey);
  const referenceDID = makeDIDFromAddress(address);
  expect((decodedToken.payload as any).iss).toEqual(referenceDID);

  expect(JSON.stringify((decodedToken.payload as any).profile)).toEqual(
    JSON.stringify(sampleProfiles.ryan)
  );
  expect((decodedToken.payload as any).username).toBe(null);

  await verifyAuthResponse(authResponse).then(verifiedResult => {
    expect(verifiedResult).toBe(true);
  });

  expect(isExpirationDateValid(authResponse)).toBe(true);
  expect(isIssuanceDateValid(authResponse)).toBe(true);
  expect(doSignaturesMatchPublicKeys(authResponse)).toBe(true);
  expect(doPublicKeysMatchIssuer(authResponse)).toBe(true);

  await doPublicKeysMatchUsername(authResponse, nameLookupURL).then(verifiedResult => {
    expect(verifiedResult).toBe(true);
  });
});

test('auth response with invalid or empty appPrivateKeyFromWalletSalt', async () => {
  let appPrivateKeyFromWalletSalt1;
  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    null,
    null,
    null,
    null,
    undefined,
    null,
    null,
    null,
    null,
    appPrivateKeyFromWalletSalt1
  );
  expect(authResponse).toBeTruthy();
  const decodedToken = decodeToken(authResponse);
  console.log('decodedToken', decodedToken);
  expect(decodedToken).toBeTruthy();
  expect((decodedToken.payload as any).appPrivateKeyFromWalletSalt).toBeNull();
});

test('auth response with valid appPrivateKeyFromWalletSalt', async () => {
  const appPrivateKeyFromWalletSalt =
    'ab9a2ad092b910902f4a74f7aeaee874497ed9bc3f6408ed8b07e22425471fde';
  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    null,
    null,
    null,
    null,
    undefined,
    null,
    null,
    null,
    null,
    appPrivateKeyFromWalletSalt
  );
  expect(authResponse).toBeTruthy();

  const decodedToken = decodeToken(authResponse);
  console.log('decodedToken', decodedToken);

  expect(decodedToken).toBeTruthy();
  expect((decodedToken.payload as any).appPrivateKeyFromWalletSalt).toEqual(
    appPrivateKeyFromWalletSalt
  );
});

test('auth response with username', async () => {
  fetchMock.mockResponse(JSON.stringify(sampleNameRecords.ryan));

  const authResponse = await makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id', null);

  await doPublicKeysMatchUsername(authResponse, nameLookupURL).then(verified => {
    expect(verified).toBe(true);
  });

  await verifyAuthResponse(authResponse).then(verifiedResult => {
    expect(verifiedResult).toBe(true);
  });

  expect(fetchMock.mock.calls.length).toEqual(1);
});

test('auth response with invalid private key', async () => {
  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });

  fetchMock.mockResponse(JSON.stringify(sampleNameRecords.ryan));

  const appPrivateKey = makeECPrivateKey();
  const transitPrivateKey = makeECPrivateKey();
  const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
  const badTransitPrivateKey = makeECPrivateKey();
  blockstack.store.getSessionData().transitKey = badTransitPrivateKey;
  const metadata = {};

  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    'ryan.id',
    metadata,
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey
  );

  const fail = jest.fn();
  const pass = jest.fn();

  await blockstack
    .handlePendingSignIn(authResponse)
    .then(fail)
    .catch(pass)
    .then(() => {
      blockstack.store.getSessionData().transitKey = transitPrivateKey;

      return blockstack.handlePendingSignIn(authResponse);
    })
    .then(pass)
    .catch(fail);

  expect(fail).toBeCalledTimes(0);
  expect(pass).toBeCalledTimes(2);
});

test('handlePendingSignIn with authResponseToken', async () => {
  fetchMock.mockResponse(JSON.stringify(sampleNameRecords.ryan));

  const appPrivateKey = makeECPrivateKey();
  const transitPrivateKey = makeECPrivateKey();
  const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
  const metadata = {};

  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });
  blockstack.store.getSessionData().transitKey = transitPrivateKey;

  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    'ryan.id',
    metadata,
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey
  );

  const pass = jest.fn();
  const fail = jest.fn();
  await blockstack.handlePendingSignIn(authResponse).then(pass).catch(fail);

  expect(fail).toBeCalledTimes(0);
  expect(pass).toBeCalledTimes(1);
  expect(fetchMock.mock.calls.length).toEqual(0);
});

test('handlePendingSignIn 2', async () => {
  fetchMock.mockResponse(JSON.stringify(sampleNameRecords.ryan));

  const appPrivateKey = makeECPrivateKey();
  const transitPrivateKey = makeECPrivateKey();
  const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
  const metadata = {};

  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    'ryan.id',
    metadata,
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey
  );

  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });
  blockstack.store.getSessionData().transitKey = transitPrivateKey;

  const pass = jest.fn();
  const fail = jest.fn();
  await blockstack.handlePendingSignIn(authResponse).then(pass).catch(fail);
  expect(fail).toBeCalledTimes(0);
  expect(pass).toBeCalledTimes(1);
  expect(fetchMock.mock.calls.length).toEqual(0);
});

test('handlePendingSignIn with existing user session', async () => {
  fetchMock.once(JSON.stringify(sampleNameRecords.ryan));

  const appPrivateKey = makeECPrivateKey();
  const transitPrivateKey = makeECPrivateKey();
  const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
  const metadata = {};

  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });
  blockstack.store.getSessionData().transitKey = transitPrivateKey;

  const sessionData = blockstack.store.getSessionData();
  (sessionData as any).userData = {
    decentralizedID: 'blockstack.id',
    username: 'blockstack.id',
    identityAddress: 'identityaddress',
    appPrivateKey: appPrivateKey,
    hubUrl: '',
    authResponseToken: '',
    profile: '',
  };
  blockstack.store.setSessionData(sessionData);

  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    'ryan.id',
    metadata,
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey
  );

  const pass = jest.fn();
  const fail = jest.fn();
  await blockstack.handlePendingSignIn(authResponse).then(fail).catch(pass);
  expect(fail).toBeCalledTimes(0);
  expect(pass).toBeCalledTimes(1);
});

test('app config defaults app domain to origin', () => {
  (global as any).window = {
    location: {
      origin: 'https://example.com',
    },
  };

  const appConfig = new AppConfig();

  expect(appConfig.appDomain).toEqual('https://example.com');
  expect(appConfig.scopes.length).toEqual(1);
  expect(appConfig.scopes[0]).toEqual('store_write');
  expect(appConfig.manifestURI()).toEqual('https://example.com/manifest.json');
  expect(appConfig.redirectURI()).toEqual('https://example.com');
  (global as any).window = undefined;
});

test('app config works with custom app domain to origin', () => {
  (global as any).window = {
    location: {
      origin: 'https://example.com',
    },
  };

  const appConfig = new AppConfig(['store_write'], 'https://custom.example.com');

  expect(appConfig.appDomain).toEqual('https://custom.example.com');
  expect(appConfig.scopes.length).toEqual(1);
  expect(appConfig.scopes[0]).toEqual('store_write');
  expect(appConfig.manifestURI()).toEqual('https://custom.example.com/manifest.json');
  expect(appConfig.redirectURI()).toEqual('https://custom.example.com');
  (global as any).window = undefined;
});

test('handlePendingSignIn with authResponseToken, transit key and custom Blockstack API URL', async () => {
  const customBlockstackAPIUrl = 'https://test.name.lookups';

  fetchMock.once(JSON.stringify(sampleNameRecords.ryan));

  const appPrivateKey = makeECPrivateKey();
  const transitPrivateKey = makeECPrivateKey();
  const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
  const metadata = {};

  const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
  const blockstack = new UserSession({ appConfig });
  blockstack.store.getSessionData().transitKey = transitPrivateKey;

  const authResponse = await makeAuthResponse(
    privateKey,
    sampleProfiles.ryan,
    'ryan.id',
    metadata,
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey,
    undefined,
    customBlockstackAPIUrl
  );

  const pass = jest.fn();
  await blockstack
    .handlePendingSignIn(authResponse)
    .then(pass)
    .catch(err => {
      console.log(err.stack);
    });
  expect(pass).toBeCalledTimes(1);
});

test(
  'handlePendingSignIn with authResponseToken, transit key, ' +
    'Blockstack API URL, and Gaia association token',
  async () => {
    const customBlockstackAPIUrl = 'https://test.name.lookups';
    fetchMock.mockResponse(JSON.stringify(sampleNameRecords.ryan));

    const appPrivateKey = makeECPrivateKey();
    const identityPrivateKey = makeECPrivateKey();
    const transitPrivateKey = makeECPrivateKey();
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey);
    const metadata = {};

    const appPublicKey = getPublicKeyFromPrivate(appPrivateKey);
    const FOUR_MONTH_SECONDS = 60 * 60 * 24 * 31 * 4;
    const salt = '00000000000000000000000000000';
    const identityPublicKey = getPublicKeyFromPrivate(identityPrivateKey);
    const associationTokenClaim = {
      childToAssociate: appPublicKey,
      iss: identityPublicKey,
      exp: FOUR_MONTH_SECONDS + Date.now() / 1000,
      salt,
    };
    const gaiaAssociationToken = new TokenSigner('ES256K', identityPrivateKey).sign(
      associationTokenClaim
    );

    const authResponse = await makeAuthResponse(
      privateKey,
      sampleProfiles.ryan,
      'ryan.id',
      metadata,
      undefined,
      appPrivateKey,
      undefined,
      transitPublicKey,
      undefined,
      customBlockstackAPIUrl,
      gaiaAssociationToken
    );

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000');
    const blockstack = new UserSession({ appConfig });
    blockstack.store.getSessionData().transitKey = transitPrivateKey;

    await blockstack
      .handlePendingSignIn(authResponse)
      .then(() => {
        expect(blockstack.loadUserData().gaiaAssociationToken).toEqual(gaiaAssociationToken);
      })
      .catch(err => {
        console.log(err.stack);
      });
  }
);

test('profileLookUp', async () => {
  const name = 'ryan.id';
  const zoneFileLookupURL = 'http://potato:6270/v1/names/';

  const mockZonefile = {
    zonefile:
      '$ORIGIN ryan.id\n$TTL 3600\n_http._tcp IN URI 10 1 "https://blockstack.s3.amazonaws.com/ryan.id"\n',
    address: 'SP3AMDH2ZZB8XQK467V9HV5CRQF2RPBZ4MDMSBHJZ',
  };

  fetchMock
    .once(JSON.stringify(mockZonefile))
    .once(JSON.stringify(sampleTokenFiles.ryan.body))
    .once(JSON.stringify(mockZonefile))
    .once(JSON.stringify(sampleTokenFiles.ryan.body));

  await lookupProfile({ username: name, zoneFileLookupURL })
    .then(profile => {
      expect(profile).toBeTruthy();
      expect(profile.name).toEqual('Ryan Shea');
    })
    .then(() => lookupProfile({ username: name }))
    .then(profile => {
      expect(profile).toBeTruthy();
      expect(profile.name).toEqual('Ryan Shea');
    });

  expect(fetchMock.mock.calls.length).toEqual(4);
  expect(fetchMock.mock.calls[0][0]).toEqual('http://potato:6270/v1/names/ryan.id');
  expect(fetchMock.mock.calls[1][0]).toEqual(sampleTokenFiles.ryan.url);
  expect(fetchMock.mock.calls[2][0]).toEqual(
    'https://stacks-node-api.mainnet.stacks.co/v1/names/ryan.id'
  );
  expect(fetchMock.mock.calls[3][0]).toEqual(sampleTokenFiles.ryan.url);
});
