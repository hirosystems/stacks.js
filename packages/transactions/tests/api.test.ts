import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/common';
import { StacksNodeApi } from '../src/api';
import { DEVNET_URL, HIRO_MAINNET_URL, HIRO_TESTNET_URL } from '../src';

describe('setting StacksApi URL', () => {
  test.each([
    { network: STACKS_MAINNET, url: HIRO_MAINNET_URL },
    { network: STACKS_TESTNET, url: HIRO_TESTNET_URL },
    { network: STACKS_DEVNET, url: DEVNET_URL },
  ])('the api class determines the correct url for each network object', ({ network, url }) => {
    const api = new StacksNodeApi({ network });
    expect(api.url).toEqual(url);
  });
});

// it('uses the correct constructor for stacks network from name strings', () => {
//   expect(StacksNetwork.fromName('mainnet').constructor.toString()).toContain('StacksMainnet');
//   expect(StacksNetwork.fromName('testnet').constructor.toString()).toContain('StacksTestnet');
//   expect(StacksNetwork.fromName('devnet').constructor.toString()).toContain('StacksMocknet'); // devnet is an alias for mocknet
//   expect(StacksNetwork.fromName('mocknet').constructor.toString()).toContain('StacksMocknet');
// });
