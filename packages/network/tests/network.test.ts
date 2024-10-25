import {
  STACKS_DEVNET,
  STACKS_MAINNET,
  STACKS_MOCKNET,
  STACKS_TESTNET,
  networkFromName,
} from '../src';

test(networkFromName.name, () => {
  expect(networkFromName('mainnet')).toEqual(STACKS_MAINNET);
  expect(networkFromName('testnet')).toEqual(STACKS_TESTNET);
  expect(networkFromName('devnet')).toEqual(STACKS_DEVNET);
  expect(networkFromName('mocknet')).toEqual(STACKS_MOCKNET);

  expect(STACKS_DEVNET).toEqual(STACKS_MOCKNET);
});
