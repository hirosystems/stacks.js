import { StacksMainnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';

import { generateWallet, restoreWalletAccounts } from "../../src";
import { mockGaiaHubInfo } from "../mocks";

beforeEach(() => {
  fetchMock.resetMocks();
});

test("restore wallet with username", async () => {
  const secretKey =
    'sound idle panel often situate develop unit text design antenna ' +
    'vendor screen opinion balcony share trigger accuse scatter visa uniform brass ' +
    'update opinion media';

  const baseWallet = await generateWallet({ secretKey, password: 'password' });

  fetchMock
  .once(mockGaiaHubInfo)
  .once(JSON.stringify("no found"), {status: 404}) // TODO mock fetch legacy wallet config 
  .once(JSON.stringify({address: "SP30RZ44NTH2D95M1HSWVMM8VVHSAFY71VF3XQZ0K"}))
  .once(JSON.stringify("ok")); // updateWalletConfig
  const wallet = await restoreWalletAccounts({
    wallet: baseWallet, gaiaHubUrl: "https://hub.gaia.com",
    network: new StacksMainnet()
  })
  expect(wallet?.accounts[0]?.username).toEqual("public_profile_for_testing.id.blockstack")
});
