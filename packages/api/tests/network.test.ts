import {
  HIRO_MAINNET_URL,
  HIRO_DEVNET_URL,
  HIRO_TESTNET_URL,
  StacksMainnet,
  StacksMocknet,
  StacksNetwork,
  StacksTestnet,
} from '../src/api';

describe('Setting coreApiUrl', () => {
  it('sets mainnet default url', () => {
    const mainnet = new StacksMainnet();
    expect(mainnet.coreApiUrl).toEqual(HIRO_MAINNET_URL);
  });
  it('sets testnet url', () => {
    const testnet = new StacksTestnet();
    expect(testnet.coreApiUrl).toEqual(HIRO_TESTNET_URL);
  });
  it('sets mocknet url', () => {
    const mocknet = new StacksMocknet();
    expect(mocknet.coreApiUrl).toEqual(HIRO_DEVNET_URL);
  });
  it('sets custom url', () => {
    const customURL = 'https://customurl.com';
    const customNET = new StacksMainnet({ url: customURL });
    expect(customNET.coreApiUrl).toEqual(customURL);
  });
});

it('uses the correct constructor for stacks network from name strings', () => {
  expect(StacksNetwork.fromName('mainnet').constructor.toString()).toContain('StacksMainnet');
  expect(StacksNetwork.fromName('testnet').constructor.toString()).toContain('StacksTestnet');
  expect(StacksNetwork.fromName('devnet').constructor.toString()).toContain('StacksMocknet'); // devnet is an alias for mocknet
  expect(StacksNetwork.fromName('mocknet').constructor.toString()).toContain('StacksMocknet');
});
