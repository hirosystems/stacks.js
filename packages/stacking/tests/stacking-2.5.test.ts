import { getPublicKeyFromPrivate, publicKeyToBtcAddress } from '@stacks/encryption';
import { StacksMocknet } from '@stacks/network';
import { makeRandomPrivKey } from '@stacks/transactions';
import { StackingClient } from '../src';
import { V2_POX_REGTEST_POX_4, setApiMocks } from './apiMockingHelpers';

beforeEach(() => {
  jest.resetModules();
  fetchMock.resetMocks();
});

describe('pox-4', () => {
  test('verify-signer-key-sig', async () => {
    const network = new StacksMocknet();
    const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
    const client = new StackingClient(address, network);

    const signerPrivateKey = makeRandomPrivKey();
    const signerKey = getPublicKeyFromPrivate(signerPrivateKey.data);

    const signature = client.signPoxSignature({
      topic: 'stack-stx',
      period: 2,
      rewardCycle: 42,
      poxAddress: publicKeyToBtcAddress(signerKey),
      maxAmount: 10_000_000_000,
      authId: 4,

      signerPrivateKey,
    });

    setApiMocks({
      '/v2/pox': V2_POX_REGTEST_POX_4,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-4/verify-signer-key-sig': `{"okay":true,"result":"0x0703"}`,
    });
    const result = await client.verifySignerKeySignature({
      amount: 9_000_000_000,

      topic: 'stack-stx',
      period: 2,
      rewardCycle: 42,
      poxAddress: publicKeyToBtcAddress(signerKey),
      maxAmount: 10_000_000_000,
      authId: 4,

      signerSignature: signature,
      signerKey,
    });
    expect(result).toBe(true);

    setApiMocks({
      '/v2/pox': V2_POX_REGTEST_POX_4,
      '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-4/verify-signer-key-sig': `{"okay":true,"result":"0x080000000000000000000000000000000023"}`,
    });
    const invalid = await client.verifySignerKeySignature({
      amount: 9_000_000_000,

      topic: 'stack-stx',
      period: 3, // period doesn't match signature
      rewardCycle: 42,
      poxAddress: publicKeyToBtcAddress(signerKey),
      maxAmount: 10_000_000_000,
      authId: 4,

      signerSignature: signature,
      signerKey: signerKey,
    });
    expect(invalid).toBe(false);
  });
});
