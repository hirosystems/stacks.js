import {
  HIRO_MAINNET_DEFAULT,
  HIRO_MOCKNET_DEFAULT,
  HIRO_TESTNET_DEFAULT,
  StacksMainnet,
  StacksMocknet,
  StacksTestnet,
} from '../src/network';

describe('Setting coreApiUrl', () => {
  test('it sets mainnet default url', () => {
    const mainnet = new StacksMainnet();
    expect(mainnet.coreApiUrl).toEqual(HIRO_MAINNET_DEFAULT);
  });
  test('it sets testnet url', () => {
    const testnet = new StacksTestnet();
    expect(testnet.coreApiUrl).toEqual(HIRO_TESTNET_DEFAULT);
  });
  test('it sets mocknet url', () => {
    const mocknet = new StacksMocknet();
    expect(mocknet.coreApiUrl).toEqual(HIRO_MOCKNET_DEFAULT);
  });
  test('it sets custom url', () => {
    const customURL = 'https://customurl.com';
    const customNET = new StacksMainnet({ url: customURL });
    expect(customNET.coreApiUrl).toEqual(customURL);
  });
});
