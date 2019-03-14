/// <reference types="node" />
/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 * @private
 * @ignore
 * */
export declare function encryptMnemonic(phrase: string, password: string): Promise<Buffer>;
/**
 * Encrypt a raw mnemonic phrase with a password
 * @param {string | Buffer} data - Buffer or hex-encoded string of the encrypted mnemonic
 * @param {string} password - Password for data
 * @return {Promise<string>} the raw mnemonic phrase
 * @private
 * @ignore
 */
export declare function decryptMnemonic(data: (string | Buffer), password: string): Promise<string>;
