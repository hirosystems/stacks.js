import {
  compressPublicKey,
  createStacksPrivateKey,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  getPublicKey,
  makeRandomPrivKey,
  privateKeyToString,
  pubKeyfromPrivKey,
  publicKeyFromSignature,
  publicKeyToString,
  signWithKey,
  StacksPublicKey,
  PubKeyEncoding,
  StacksMessageType,
  TransactionVersion
} from '../src';

import { serializeDeserialize } from './macros';

test('Stacks public key and private keys', () => {
  const privKeyString = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc';
  const pubKeyString =
    '04ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab' +
    '5b435d20ea91337cdd8c30dd7427bb098a5355e9c9bfad43797899b8137237cf';
  const pubKey = pubKeyfromPrivKey(privKeyString);
  expect(publicKeyToString(pubKey)).toBe(pubKeyString);

  const deserialized = serializeDeserialize(pubKey, StacksMessageType.PublicKey) as StacksPublicKey;
  expect(publicKeyToString(deserialized)).toBe(pubKeyString);

  const privKey = createStacksPrivateKey(privKeyString);
  expect(publicKeyToString(getPublicKey(privKey))).toBe(pubKeyString);

  const randomKey = makeRandomPrivKey();
  expect(privateKeyToString(randomKey).length).toEqual(64);

  expect(getAddressFromPrivateKey(privKeyString)).toBe('SPZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZEA9PX5');
  expect(getAddressFromPrivateKey(Buffer.from(privKeyString, 'hex'))).toBe(
    'SPZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZEA9PX5'
  );

  expect(getAddressFromPrivateKey(privKeyString, TransactionVersion.Testnet)).toBe(
    'STZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZG8ZXFM'
  );
  expect(
    getAddressFromPrivateKey(Buffer.from(privKeyString, 'hex'), TransactionVersion.Testnet)
  ).toBe('STZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZG8ZXFM');

  expect(getAddressFromPublicKey(pubKeyString)).toBe('SPZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZEA9PX5');
  expect(getAddressFromPublicKey(Buffer.from(pubKeyString, 'hex'))).toBe(
    'SPZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZEA9PX5'
  );

  expect(getAddressFromPublicKey(pubKeyString, TransactionVersion.Testnet)).toBe(
    'STZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZG8ZXFM'
  );
  expect(
    getAddressFromPublicKey(Buffer.from(pubKeyString, 'hex'), TransactionVersion.Testnet)
  ).toBe('STZG6BAY4JVR9RNAB1HY92B7Q208ZYY4HZG8ZXFM');

  const compressedPubKey = compressPublicKey(pubKey.data).data.toString('hex');
  expect(compressedPubKey).toBe('03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab');
});

test('Retrieve public key from signature', () => {
  const privKey = createStacksPrivateKey('edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc');
  const uncompressedPubKey =
    '04ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab5b435d20ea91337cdd8c30dd7427bb098a5355e9c9bfad43797899b8137237cf';
  const compressedPubKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';

  const message = 'hello world';
  const sig = signWithKey(privKey, message);

  const uncompressedPubKeyFromSig = publicKeyFromSignature(message, sig, PubKeyEncoding.Uncompressed)
  const compressedPubKeyFromSig = publicKeyFromSignature(message, sig, PubKeyEncoding.Compressed)

  expect(uncompressedPubKeyFromSig).toBe(uncompressedPubKey);
  expect(compressedPubKeyFromSig).toBe(compressedPubKey);
})
