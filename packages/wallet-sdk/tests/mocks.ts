import { Wallet, WalletConfig } from '../src';

// todo: clean up unused mock values

export const mockWallet: Wallet = {
  salt: 'c15619adafe7e75a195a1a2b5788ca42e585a3fd181ae2ff009c6089de54ed9e',
  rootKey:
    'xprv9s21ZrQH143K2KAnQL9secDrgY84y7bFrxFdtBjASeGwYyCRgDRjuJAbmnUCjRsGX8z7A7ML2Kj91Uv7aWe8n5suV5bUa6mvcysgCx9TGFc',
  configPrivateKey: '67e113e8ccf43fc8a724710620cf369f23c34c396c649615c31e1fd9aaf23d72',
  encryptedSecretKey:
    'dcdbcd5218509dfcfc5866485b31a590fe96ede9790c3926f6eeaffaf99274f50be7d0a1e1d96ca9d3aa83e459c78b3e11c9a5b3c9ae49505e3c92357927388f5b9a33079b25ae9c37e97769e05bbafc628059e0a2e4d97b67891180df6bf19e',
  accounts: [
    {
      stxPrivateKey: '8721c6a5237f5e8d361161a7855aa56885a3e19e2ea6ee268fb14eabc5e2ed9001',
      dataPrivateKey: 'a29c3e73dba79ab0f84cb792bafd65ec71f243ebe67a7ebd842ef5cdce3b21eb',
      appsKey:
        'xprvA1y4zBndD83n6PWgVH6ivkTpNQ2WU1UGPg9hWa2q8sCANa7YrYMZFHWMhrbpsarxXMuQRa4jtaT2YXugwsKrjFgn765tUHu9XjyiDFEjB7f',
      index: 0,
      salt: 'c15619adafe7e75a195a1a2b5788ca42e585a3fd181ae2ff009c6089de54ed9e',
    },
  ],
};

export const mockAccount = mockWallet.accounts[0];

export const mockWalletConfig: WalletConfig = {
  accounts: [
    {
      username: 'hankstoever.id',
      apps: {
        'http://localhost:3000': {
          origin: 'http://localhost:3000',
          scopes: ['read_write'],
          name: 'Tester',
          appIcon: 'http://example.com/icon.png',
          lastLoginAt: new Date().getTime(),
        },
      },
    },
  ],
};

export const mockGaiaHubInfo = JSON.stringify({
  read_url_prefix: 'https://gaia.blockstack.org/hub/',
  challenge_text: '["gaiahub","0","gaia-0","blockstack_storage_please_sign"]',
  latest_auth_version: 'v1',
});

export const MOCK_PROFILE_RESPONSE = [
  {
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJqdGkiOiJmYmY1YjU4OC03NjA1LTQ4YWEtOWZkZi1iMTI2ODhhMGQwNDciLCJpYXQiOiIyMDIwLTA1LTE5VDEyOjQwOjA5LjQ4OVoiLCJleHAiOiIyMDIxLTA1LTE5VDEyOjQwOjA5LjQ4OVoiLCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzZTkzYWU2NWQ2Njc1MDYxYTE2N2MzNGI4MzIxYmVmODc1OTQ0NjhlOWIyZGQxOWMwNWE2N2E3YjRjYWVmYTAxNyJ9LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDNlOTNhZTY1ZDY2NzUwNjFhMTY3YzM0YjgzMjFiZWY4NzU5NDQ2OGU5YjJkZDE5YzA1YTY3YTdiNGNhZWZhMDE3In0sImNsYWltIjp7IkB0eXBlIjoiUGVyc29uIiwiQGNvbnRleHQiOiJodHRwOi8vc2NoZW1hLm9yZyIsImFwcHMiOnsiaHR0cHM6Ly9iYW50ZXIucHViIjoiaHR0cHM6Ly9nYWlhLmJsb2Nrc3RhY2sub3JnL2h1Yi8xRGt1QUNodWZZalRrVENlakpnU3p0dXFwNUtkeWtwV2FwLyIsImh0dHA6Ly8xMjcuMC4wLjE6MzAwMCI6Imh0dHBzOi8vZ2FpYS5ibG9ja3N0YWNrLm9yZy9odWIvMTVoQUxuRUo4ZnZYTmdSeXptVnNwRHlaY0dFeExHSE5TZi8iLCJodHRwczovL2Jsb2Nrc3RhY2suZ2l0aHViLmlvIjoiaHR0cHM6Ly9nYWlhLmJsb2Nrc3RhY2sub3JnL2h1Yi8xRUR1dktmenVOUlVlbnR6MXQ1amZ4VDlmVzFIUDJOSkdXLyJ9LCJhcGkiOnsiZ2FpYUh1YkNvbmZpZyI6eyJ1cmxfcHJlZml4IjoiaHR0cHM6Ly9nYWlhLmJsb2Nrc3RhY2sub3JnL2h1Yi8ifSwiZ2FpYUh1YlVybCI6Imh0dHBzOi8vaHViLmJsb2Nrc3RhY2sub3JnIn0sImFwcHNNZXRhIjp7Imh0dHBzOi8vYmFudGVyLnB1YiI6eyJzdG9yYWdlIjoiaHR0cHM6Ly9nYWlhLmJsb2Nrc3RhY2sub3JnL2h1Yi8xRGt1QUNodWZZalRrVENlakpnU3p0dXFwNUtkeWtwV2FwLyIsInB1YmxpY0tleSI6IjAyMDIxZWZkMGVjM2E0Y2ZkZGQ5ZjA1OTg4NGE4MzRiYjMzMmM4N2ZkYWRhMDUzODA3NzBiZmY1M2Q1ODQ2ZThhYSJ9fX19.GyFt9EZXwr8_jbunvrA38Rv80oBsgjokEPz4SXmZ724I8FCn22g7PK5tWBmpLCZAqVaaYgls9oJcX0vYN-BVsA',
    decodedToken: {
      header: {
        typ: 'JWT',
        alg: 'ES256K',
      },
      payload: {
        jti: 'fbf5b588-7605-48aa-9fdf-b12688a0d047',
        iat: '2020-05-19T12:40:09.489Z',
        exp: '2021-05-19T12:40:09.489Z',
        subject: {
          publicKey: '03e93ae65d6675061a167c34b8321bef87594468e9b2dd19c05a67a7b4caefa017',
        },
        issuer: {
          publicKey: '03e93ae65d6675061a167c34b8321bef87594468e9b2dd19c05a67a7b4caefa017',
        },
        claim: {
          '@type': 'Person',
          '@context': 'http://schema.org',
          apps: {
            'https://banter.pub':
              'https://gaia.blockstack.org/hub/1DkuAChufYjTkTCejJgSztuqp5KdykpWap/',
            'http://127.0.0.1:3000':
              'https://gaia.blockstack.org/hub/15hALnEJ8fvXNgRyzmVspDyZcGExLGHNSf/',
            'https://blockstack.github.io':
              'https://gaia.blockstack.org/hub/1EDuvKfzuNRUentz1t5jfxT9fW1HP2NJGW/',
          },
          api: {
            gaiaHubConfig: {
              url_prefix: 'https://gaia.blockstack.org/hub/',
            },
            gaiaHubUrl: 'https://hub.blockstack.org',
          },
          appsMeta: {
            'https://banter.pub': {
              storage: 'https://gaia.blockstack.org/hub/1DkuAChufYjTkTCejJgSztuqp5KdykpWap/',
              publicKey: '02021efd0ec3a4cfddd9f059884a834bb332c87fdada05380770bff53d5846e8aa',
            },
          },
        },
      },
      signature:
        'GyFt9EZXwr8_jbunvrA38Rv80oBsgjokEPz4SXmZ724I8FCn22g7PK5tWBmpLCZAqVaaYgls9oJcX0vYN-BVsA',
    },
  },
];
