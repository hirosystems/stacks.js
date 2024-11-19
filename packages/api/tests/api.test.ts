import { DEVNET_URL, HIRO_MAINNET_URL, HIRO_TESTNET_URL } from '@stacks/common';
import { STACKS_DEVNET, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { StacksNodeApi } from '../src';

describe('setting StacksApi URL', () => {
  test.each([
    { network: STACKS_MAINNET, url: HIRO_MAINNET_URL },
    { network: STACKS_TESTNET, url: HIRO_TESTNET_URL },
    { network: STACKS_DEVNET, url: DEVNET_URL },
  ])('the api class determines the correct url for each network object', ({ network, url }) => {
    const api = new StacksNodeApi({ network });
    expect(api.baseUrl).toEqual(url);
  });
});
