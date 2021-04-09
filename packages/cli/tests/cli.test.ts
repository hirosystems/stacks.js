import { testables } from '../src/cli';
import { getNetwork, CLINetworkAdapter, CLI_NETWORK_OPTS } from '../src/network';
import { CLI_CONFIG_TYPE } from '../src/argparse';

import * as fixtures from './fixtures/cli.fixture';

const { addressConvert } = testables as any;

const mainnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, false),
  {} as CLI_NETWORK_OPTS
);

const testnetNetwork = new CLINetworkAdapter(
  getNetwork({} as CLI_CONFIG_TYPE, true),
  {} as CLI_NETWORK_OPTS
);

describe('convert_address', () => {
  test.each(fixtures.convertAddress)('%p - testnet: %p', async (input, testnet, expectedResult) => {
    const network = testnet ? testnetNetwork : mainnetNetwork;
    const result = await addressConvert(network, [input]);
    expect(JSON.parse(result)).toEqual(expectedResult);
  });
});
