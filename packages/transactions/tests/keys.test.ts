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
import { utf8ToBytes } from '@stacks/common';
import { randomBytes } from '../src/utils';
import {
  utils,
  verify as nobleSecp256k1Verify,
  signSync as nobleSecp256k1Sign,
  getPublicKey as nobleGetPublicKey
} from '@noble/secp256k1';
import { serializeDeserialize } from './macros';
import { ec as EC } from 'elliptic';

// Create and initialize EC context
// Better do it once and reuse it
const ec = new EC('secp256k1');

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
  const messageHex = utils.bytesToHex(utf8ToBytes(message));
  const sig = signWithKey(privKey, messageHex);

  const uncompressedPubKeyFromSig = publicKeyFromSignature(messageHex, sig, PubKeyEncoding.Uncompressed)
  const compressedPubKeyFromSig = publicKeyFromSignature(messageHex, sig, PubKeyEncoding.Compressed)

  expect(uncompressedPubKeyFromSig).toBe(uncompressedPubKey);
  expect(compressedPubKeyFromSig).toBe(compressedPubKey);
})

test('Sign msg using elliptic/secp256k1 and verify signature using @noble/secp256k1', () => {
  // Maximum keypairs to try if a keypairs is not accepted by @noble/secp256k1
  const keyPairAttempts = 8; // Normally a keypairs is accepted in first or second attempt

  let nobleVerifyResult = false;

  for (let i = 0; i < keyPairAttempts && !nobleVerifyResult; i++) {
    // Generate keys
    const options = { entropy: randomBytes(32) };
    const keyPair = ec.genKeyPair(options);

    const msg = 'hello world';
    const msgHex = utils.bytesToHex(utf8ToBytes(msg));

    // Sign msg using elliptic/secp256k1
    // input must be an array, or a hex-string
    const signature = keyPair.sign(msgHex);

    // Export DER encoded signature in hex format
    const signatureHex = signature.toDER('hex');

    // Verify signature using elliptic/secp256k1
    const ellipticVerifyResult = keyPair.verify(msgHex, signatureHex);

    expect(ellipticVerifyResult).toBeTruthy();

    // Get public key from key-pair
    const publicKey = keyPair.getPublic().encodeCompressed('hex');

    // Verify same signature using @noble/secp256k1
    nobleVerifyResult = nobleSecp256k1Verify(signatureHex, msgHex, publicKey);
  }
  // Verification result by @noble/secp256k1 should be true
  expect(nobleVerifyResult).toBeTruthy();
})

test('Sign msg using @noble/secp256k1 and verify signature using elliptic/secp256k1', () => {
  // Generate private key
  const privateKey = utils.randomPrivateKey();

  const msg = 'hello world';
  const msgHex = utils.bytesToHex(utf8ToBytes(msg));

  // Sign msg using @noble/secp256k1
  // input must be a hex-string
  const signature = nobleSecp256k1Sign(msgHex, privateKey);

  const publicKey = nobleGetPublicKey(privateKey);

  // Verify signature using @noble/secp256k1
  const nobleVerifyResult = nobleSecp256k1Verify(signature, msgHex, publicKey);

  // Verification result by @noble/secp256k1
  expect(nobleVerifyResult).toBeTruthy();

  // Generate keypair using private key
  const keyPair = ec.keyFromPrivate(privateKey);

  // Verify signature using elliptic/secp256k1
  const ellipticVerifyResult = keyPair.verify(msgHex, signature);

  // Verification result by elliptic/secp256k1 should be true
  expect(ellipticVerifyResult).toBeTruthy();
})
