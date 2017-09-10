/* @flow */
import { randomBytes } from 'crypto'
import { ECPair, address as baddress, crypto as bcrypto } from 'bitcoinjs-lib'

const BigInteger = require('bigi');

export function getEntropy(numberOfBytes: number) {
  if (!numberOfBytes) {
    numberOfBytes = 32
  }
  return randomBytes(numberOfBytes)
}

export function makeECPrivateKey() {
  const keyPair = new ECPair.makeRandom({ rng: getEntropy })
  return keyPair.d.toBuffer(32).toString('hex')
}

export function publicKeyToAddress(publicKey: string) {
  const publicKeyBuffer = new Buffer(publicKey, 'hex')
  const publicKeyHash160 = bcrypto.hash160(publicKeyBuffer)
  const address = baddress.toBase58Check(publicKeyHash160, 0x00)
  return address
}

/*
 * Decode a hex string into a byte buffer.
 *
 * @param hex (String) a string of hex digits.
 *
 * Returns a buffer with the raw bytes
 */
export function decodeHexString(hex: string) {
    const bytes = [];
    for (let i = 0; i < hex.length - 1; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return Buffer.from(bytes)
}


/*
 * Decode an ECDSA private key into a byte buffer
 * (compatible with Bitcoin's 'compressed' flag quirk)
 *
 * @param privkey_hex (String) a hex-encoded ECDSA private key on secp256k1; optionally ending in '01'
 *
 * Returns a Buffer with the private key data
 */
export function decodePrivateKey(privatekey_hex: string) {
   if (privatekey_hex.length === 66 && privatekey_hex.slice(64, 66) === '01') {
       // truncate the '01', which is a hint to Bitcoin to expect a compressed public key
       privatekey_hex = privatekey_hex.slice(0, 64);
   }
   return decodeHexString(privatekey_hex);
}


/*
 * Convert a public key to its uncompressed format
 *
 * @param pubkey (string) the public key as a hex string
 *
 * Returns a string that encodes the uncompressed public key
 */
export function decompressPublicKey(pubkey_hex: string) {
   const pubk = ECPair.fromPublicKeyBuffer(Buffer.from(pubkey_hex, 'hex'));
   pubk.compressed = false;
   
   const public_key_str = pubk.getPublicKeyBuffer().toString('hex');
   return public_key_str;
}


/*
 * Convert a public key to its compressed format
 *
 * @param pubkey (string) the public key as a hex string
 *
 * Returns a string that encodes the uncompressed public key
 */
export function compressPublicKey(pubkey_hex: string) {
   const pubk = ECPair.fromPublicKeyBuffer(Buffer.from(pubkey_hex, 'hex'));
   pubk.compressed = true;
   
   const public_key_str = pubk.getPublicKeyBuffer().toString('hex');
   return public_key_str;
}

/*
 * Get a *uncompressed* public key (hex) from private key
 */
export function getPubkeyHex(privkey_hex: string) {
   const privkey = BigInteger.fromBuffer(decodePrivateKey(privkey_hex));
   const public_key = new ECPair(privkey);
   const public_key_str = decompressPublicKey(public_key.getPublicKeyBuffer().toString('hex'));
   return public_key_str;
}
