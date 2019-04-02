import bitcoinjs from 'bitcoinjs-lib';
export interface TransactionSigner {
    /**
     * @returns version number of the signer, currently, should always be 1
     * @private
     * @ignore
     */
    signerVersion(): number;
    /**
     * @returns a string representing the transaction signer's address
     * (usually Base58 check encoding)
     * @private
     * @ignore
     */
    getAddress(): Promise<string>;
    /**
     * Signs a transaction input
     * @param {TransactionBuilder} transaction - the transaction to sign
     * @param {number} inputIndex - the input on the transaction to sign
     * @private
     * @ignore
     */
    signTransaction(transaction: bitcoinjs.TransactionBuilder, inputIndex: number): Promise<void>;
}
/**
 * Class representing a transaction signer for pubkeyhash addresses
 * (a.k.a. single-sig addresses)
 * @private
 * @ignore
 */
export declare class PubkeyHashSigner implements TransactionSigner {
    ecPair: bitcoinjs.ECPair;
    constructor(ecPair: bitcoinjs.ECPair);
    static fromHexString(keyHex: string): PubkeyHashSigner;
    signerVersion(): number;
    getAddress(): Promise<string>;
    signTransaction(transaction: bitcoinjs.TransactionBuilder, inputIndex: number): Promise<void>;
}
