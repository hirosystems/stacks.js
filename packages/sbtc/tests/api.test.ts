import { describe, expect, test } from 'vitest';
import { DevEnvApi } from '../src';

describe('api tests', () => {
  test('fetch utxos bitcoin rpc', async () => {
    const devEnv = new DevEnvApi();
    const unspent = await devEnv.fetchUtxos('mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsH');

    expect(unspent.length).toBeGreaterThan(0);
    expect(unspent[0]).toMatchObject(
      expect.objectContaining({ txid: expect.any(String), hex: expect.any(String) })
    );
  });
});
