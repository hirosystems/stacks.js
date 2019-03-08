/// <reference types="node" />
import BN from 'bn.js';
export declare type CipherObject = {
    iv: string;
    ephemeralPK: string;
    cipherText: string;
    mac: string;
    wasString: boolean;
};
export declare function getHexFromBN(bnInput: BN): string;
/**
 * Encrypt content to elliptic curve publicKey using ECIES
 * @param {String} publicKey - secp256k1 public key hex string
 * @param {String | Buffer} content - content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 *  @private
 */
export declare function encryptECIES(publicKey: string, content: string | Buffer): CipherObject;
/**
 * Decrypt content encrypted using ECIES
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} cipherObject - object to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * @return {Buffer} plaintext
 * @throws {Error} if unable to decrypt
 * @private
 */
export declare function decryptECIES(privateKey: string, cipherObject: CipherObject): Buffer | string;
/**
 * Sign content using ECDSA
 * @private
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 * @private
 */
export declare function signECDSA(privateKey: string, content: string | Buffer): {
    publicKey: string;
    signature: string;
};
/**
 * Verify content using ECDSA
 * @param {String | Buffer} content - Content to verify was signed
 * @param {String} publicKey - secp256k1 private key hex string
 * @param {String} signature - Hex encoded DER signature
 * @return {Boolean} returns true when signature matches publickey + content, false if not
 * @private
 */
export declare function verifyECDSA(content: string | ArrayBuffer | Buffer, publicKey: string, signature: string): boolean;
