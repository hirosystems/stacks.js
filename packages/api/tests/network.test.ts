import {
  HIRO_MAINNET_DEFAULT,
  HIRO_MOCKNET_DEFAULT,
  HIRO_TESTNET_DEFAULT,
  StacksMainnet,
  StacksMocknet,
  StacksNetwork,
  StacksTestnet,
} from '../src/network';

describe('Setting coreApiUrl', () => {
  it('sets mainnet default url', () => {
    const mainnet = new StacksMainnet();
    expect(mainnet.coreApiUrl).toEqual(HIRO_MAINNET_DEFAULT);
  });
  it('sets testnet url', () => {
    const testnet = new StacksTestnet();
    expect(testnet.coreApiUrl).toEqual(HIRO_TESTNET_DEFAULT);
  });
  it('sets mocknet url', () => {
    const mocknet = new StacksMocknet();
    expect(mocknet.coreApiUrl).toEqual(HIRO_MOCKNET_DEFAULT);
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
