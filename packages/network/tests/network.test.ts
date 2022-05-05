import {
  HIRO_MAINNET_DEFAULT,
  HIRO_MOCKNET_DEFAULT,
  HIRO_TESTNET_DEFAULT,
  makeNetwork,
  StacksMainnet,
  StacksMocknet,
  StacksTestnet,
} from '../src';

describe('Setting apiUrl', () => {
  test('it sets mainnet default url', () => {
    const mainnet = StacksMainnet;
    expect(mainnet.apiUrl).toEqual(HIRO_MAINNET_DEFAULT);
  });
  test('it sets testnet url', () => {
    const testnet = StacksTestnet;
    expect(testnet.apiUrl).toEqual(HIRO_TESTNET_DEFAULT);
  });
  test('it sets mocknet url', () => {
    const mocknet = StacksMocknet;
    expect(mocknet.apiUrl).toEqual(HIRO_MOCKNET_DEFAULT);
  });
  test('it sets custom url', () => {
    const customURL = 'https://customurl.com';
    const customNET = makeNetwork({
      ...StacksMainnet,
      apiUrl: customURL,
    });
    expect(customNET.apiUrl).toEqual(customURL);
  });
});
