import { Buffer } from '@stacks/common';
import { address, ECPair, networks } from 'bitcoinjs-lib';
import { SECP256K1Client } from 'jsontokens';
import {
  getPublicKeyFromPrivate,
  hashSha256Sync,
  makeECPrivateKey,
  publicKeyToAddress,
} from '../src';
import { hashRipemd160 } from '../src/hashRipemd160';
import { ecSign } from '../src/keys';

test('makeECPrivateKey', () => {
  const privateKey = makeECPrivateKey();
  expect(privateKey).toBeTruthy();
  expect(typeof privateKey).toEqual('string');

  const publicKey = getPublicKeyFromPrivate(privateKey);
  expect(publicKey).toBeTruthy();
  expect(typeof publicKey).toEqual('string');

  const secpClientPublicKey = SECP256K1Client.derivePublicKey(privateKey);
  expect(publicKeyToAddress(publicKey)).toEqual(publicKeyToAddress(secpClientPublicKey));
});

test('public key from private key matches bitcoinjs', () => {
  const privateKey = makeECPrivateKey();
  const publicKey = getPublicKeyFromPrivate(privateKey);

  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  const bitcoinJsPublicKey = keyPair.publicKey.toString('hex');

  expect(publicKey).toEqual(bitcoinJsPublicKey);
});

test('public key via noble from bitcoinjs private key matches bitcoinjs', () => {
  const privateKey = ECPair.makeRandom().privateKey!.toString('hex');
  const publicKey = getPublicKeyFromPrivate(privateKey);

  const bitcoinJsKeyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  const bitcoinJsPublicKey = bitcoinJsKeyPair.publicKey.toString('hex');

  expect(publicKey).toEqual(bitcoinJsPublicKey);
});

test('public key to address matches bitcoinjs', () => {
  const privateKey = makeECPrivateKey();
  const publicKey = getPublicKeyFromPrivate(privateKey);

  const publicKeyHash160 = hashRipemd160(hashSha256Sync(Buffer.from(publicKey, 'hex')));
  const bitcoinJsAddress = address.toBase58Check(publicKeyHash160, networks.bitcoin.pubKeyHash);

  expect(publicKeyToAddress(publicKey)).toEqual(bitcoinJsAddress);
});

test('publicKeyToAddress', () => {
  const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01';
  const expectedAddress = '1WykMawQRnLh7SWmmoRL4qTDNCgAsVRF1';

  expect(publicKeyToAddress(getPublicKeyFromPrivate(privateKey))).toEqual(expectedAddress);
});

test('ecSign', () => {
  const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01';
  const challengeText = 'somestring';
  // signatureHex generated with previous dependency: bitcoinjs-lib
  const signatureHex =
    'ff7803e1a6cdd6a28c368fb324f24e1e7f9b024b21524edae6e6fe21e52a92cb156621f8dd66d12f1848a3151c7f04cebe8bcf617f0cc8e43a592f883b29aa02';

  const digest = hashSha256Sync(Buffer.from(challengeText));
  const signature = ecSign(digest, privateKey);

  expect(signature.toString('hex')).toEqual(signatureHex);
});
