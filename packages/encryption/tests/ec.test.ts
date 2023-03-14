import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, concatBytes, hexToBytes } from '@stacks/common';
import {
  signECDSA,
  signStrictECDSA,
  verifyMessageSignature,
  verifyMessageSignatureRsv,
  verifyStrictMessageSignatureRsv,
} from '../src/ec';
import { randomPrivateKey } from '../src/cryptoRandom';
import { getPublicKeyFromPrivate } from '../src/keys';

test('verifyMessageSignature', () => {
  // $ clarinet console
  // > (secp256k1-verify
  //     0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
  //     0xf540e429fc6e8a4c27f2782479e739cae99aa21e8cb25d4436f333577bc791cd1d9672055dd1604dd5194b88076e4f859dd93c834785ed589ec38291698d414200
  //     0x0290255f88fa311f5dee9425ce33d7d516c24157e2aae8e25a6c631dd6f7322aef
  //   )
  // >> true

  const publicKey = '0290255f88fa311f5dee9425ce33d7d516c24157e2aae8e25a6c631dd6f7322aef';
  const signatureVrs =
    '00f540e429fc6e8a4c27f2782479e739cae99aa21e8cb25d4436f333577bc791cd1d9672055dd1604dd5194b88076e4f859dd93c834785ed589ec38291698d4142';
  const message = sha256('Hello World');

  expect(verifyMessageSignature({ signature: signatureVrs, publicKey, message })).toBe(true);
});

test('verifyMessageSignatureRsv', () => {
  // $ clarinet console
  // > (secp256k1-verify
  //     0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
  //     0xf540e429fc6e8a4c27f2782479e739cae99aa21e8cb25d4436f333577bc791cd1d9672055dd1604dd5194b88076e4f859dd93c834785ed589ec38291698d414200
  //     0x0290255f88fa311f5dee9425ce33d7d516c24157e2aae8e25a6c631dd6f7322aef
  //   )
  // >> true

  const publicKey = '0290255f88fa311f5dee9425ce33d7d516c24157e2aae8e25a6c631dd6f7322aef';
  const signatureRsv =
    'f540e429fc6e8a4c27f2782479e739cae99aa21e8cb25d4436f333577bc791cd1d9672055dd1604dd5194b88076e4f859dd93c834785ed589ec38291698d414200';
  const message = sha256('Hello World');

  expect(bytesToHex(message)).toBe(
    'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
  );
  expect(verifyMessageSignatureRsv({ signature: signatureRsv, publicKey, message })).toBe(true);
});

test('verifyStrictMessageSignatureRsv', () => {
  const secretKey = bytesToHex(randomPrivateKey());
  const publicKey = getPublicKeyFromPrivate(secretKey);
  const message = sha256('Hello World');
  expect(bytesToHex(message)).toBe(
    'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
  );
  const signature = signStrictECDSA(secretKey, message);
  const signatureRsv = signature.signature;
  expect(verifyStrictMessageSignatureRsv({ signature: signatureRsv, publicKey, message })).toBe(
    true
  );

  const publicKeyAndMessage = sha256(
    concatBytes(
      hexToBytes(publicKey),
      new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64])
    )
  );
  expect(
    verifyMessageSignatureRsv({ signature: signatureRsv, publicKey, message: publicKeyAndMessage })
  ).toBe(true);
});
