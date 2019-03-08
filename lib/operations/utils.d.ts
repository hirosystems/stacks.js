/// <reference types="node" />
import bitcoinjs from 'bitcoinjs-lib';
import { TransactionSigner } from './signers';
import { UTXO } from '../network';
export declare const DUST_MINIMUM = 5500;
export declare function hash160(buff: Buffer): Buffer;
export declare function hash128(buff: Buffer): Buffer;
export declare function getTransactionInsideBuilder(txBuilder: bitcoinjs.TransactionBuilder): bitcoinjs.Transaction;
export declare function estimateTXBytes(txIn: bitcoinjs.Transaction | bitcoinjs.TransactionBuilder, additionalInputs: number, additionalOutputs: number): number;
export declare function sumOutputValues(txIn: bitcoinjs.Transaction | bitcoinjs.TransactionBuilder): number;
export declare function decodeB40(input: string): string;
/**
 * Adds UTXOs to fund a transaction
 * @param {TransactionBuilder} txBuilderIn - a transaction builder object to add the inputs to. this
 *    object is _always_ mutated. If not enough UTXOs exist to fund, the tx builder object
 *    will still contain as many inputs as could be found.
 * @param {Array<{value: number, tx_hash: string, tx_output_n}>} utxos - the utxo set for the
 *    payer's address.
 * @param {number} amountToFund - the amount of satoshis to fund in the transaction. the payer's
 *    utxos will be included to fund up to this amount of *output* and the corresponding *fees*
 *    for those additional inputs
 * @param {number} feeRate - the satoshis/byte fee rate to use for fee calculation
 * @param {boolean} fundNewFees - if true, this function will fund `amountToFund` and any new fees
 *    associated with including the new inputs.
 *    if false, this function will fund _at most_ `amountToFund`
 * @returns {number} - the amount of leftover change (in satoshis)
 * @private
 */
export declare function addUTXOsToFund(txBuilderIn: bitcoinjs.TransactionBuilder, utxos: Array<UTXO>, amountToFund: number, feeRate: number, fundNewFees?: boolean): number;
export declare function signInputs(txB: bitcoinjs.TransactionBuilder, defaultSigner: TransactionSigner, otherSigners?: Array<{
    index: number;
    signer: TransactionSigner;
}>): Promise<bitcoinjs.TransactionBuilder>;
