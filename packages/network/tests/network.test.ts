import {
  HIRO_MAINNET_DEFAULT,
  HIRO_MOCKNET_DEFAULT,
  HIRO_TESTNET_DEFAULT,
  StacksMainnet,
  StacksMocknet,
  StacksTestnet,
} from '@stacks/network';

test('network test-- coreApiUrl', () => {
  const mainnet = new StacksMainnet();
  expect(mainnet.coreApiUrl).toBe(HIRO_MAINNET_DEFAULT);

  const testnet = new StacksTestnet();
  expect(testnet.coreApiUrl).toBe(HIRO_TESTNET_DEFAULT);

  const mocknet = new StacksMocknet();
  expect(mocknet.coreApiUrl).toBe(HIRO_MOCKNET_DEFAULT);

  const customURL = 'customeURL';
  const customNET = new StacksMainnet({ url: customURL });
  expect(customNET.coreApiUrl).toBe(customURL);
});
