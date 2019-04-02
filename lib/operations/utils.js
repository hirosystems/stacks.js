"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var ripemd160_1 = __importDefault(require("ripemd160"));
var bn_js_1 = __importDefault(require("bn.js"));
var errors_1 = require("../errors");
exports.DUST_MINIMUM = 5500;
function hash160(buff) {
    var sha256 = bitcoinjs_lib_1.default.crypto.sha256(buff);
    return (new ripemd160_1.default()).update(sha256).digest();
}
exports.hash160 = hash160;
function hash128(buff) {
    return Buffer.from(bitcoinjs_lib_1.default.crypto.sha256(buff).slice(0, 16));
}
exports.hash128 = hash128;
// COPIED FROM coinselect, because 1 byte matters sometimes.
// baseline estimates, used to improve performance
var TX_EMPTY_SIZE = 4 + 1 + 1 + 4;
var TX_INPUT_BASE = 32 + 4 + 1 + 4;
var TX_INPUT_PUBKEYHASH = 107;
var TX_OUTPUT_BASE = 8 + 1;
var TX_OUTPUT_PUBKEYHASH = 25;
function inputBytes(input) {
    if (input && input.script && input.script.length > 0) {
        return TX_INPUT_BASE + input.script.length;
    }
    else {
        return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH;
    }
}
function outputBytes(output) {
    if (output && output.script && output.script.length > 0) {
        return TX_OUTPUT_BASE + output.script.length;
    }
    else {
        return TX_OUTPUT_BASE + TX_OUTPUT_PUBKEYHASH;
    }
}
function transactionBytes(inputs, outputs) {
    return TX_EMPTY_SIZE
        + inputs.reduce(function (a, x) { return (a + inputBytes(x)); }, 0)
        + outputs.reduce(function (a, x) { return (a + outputBytes(x)); }, 0);
}
function getTransactionInsideBuilder(txBuilder) {
    return txBuilder.__tx;
}
exports.getTransactionInsideBuilder = getTransactionInsideBuilder;
function getTransaction(txIn) {
    if (txIn instanceof bitcoinjs_lib_1.default.Transaction) {
        return txIn;
    }
    return getTransactionInsideBuilder(txIn);
}
//
function estimateTXBytes(txIn, additionalInputs, additionalOutputs) {
    var innerTx = getTransaction(txIn);
    var dummyInputs = new Array(additionalInputs);
    dummyInputs.fill(null);
    var dummyOutputs = new Array(additionalOutputs);
    dummyOutputs.fill(null);
    var inputs = [].concat(innerTx.ins, dummyInputs);
    var outputs = [].concat(innerTx.outs, dummyOutputs);
    return transactionBytes(inputs, outputs);
}
exports.estimateTXBytes = estimateTXBytes;
function sumOutputValues(txIn) {
    var innerTx = getTransaction(txIn);
    return innerTx.outs.reduce(function (agg, x) { return agg + x.value; }, 0);
}
exports.sumOutputValues = sumOutputValues;
function decodeB40(input) {
    // treat input as a base40 integer, and output a hex encoding
    // of that integer.
    //
    //   for each digit of the string, find its location in `characters`
    //    to get the value of the digit, then multiply by 40^(-index in input)
    // e.g.,
    // the 'right-most' character has value: (digit-value) * 40^0
    //  the next character has value: (digit-value) * 40^1
    //
    // hence, we reverse the characters first, and use the index
    //  to compute the value of each digit, then sum
    var characters = '0123456789abcdefghijklmnopqrstuvwxyz-_.+';
    var base = new bn_js_1.default(40);
    var inputDigits = input.split('').reverse();
    var digitValues = inputDigits.map((function (character, exponent) { return new bn_js_1.default(characters.indexOf(character))
        .mul(base.pow(new bn_js_1.default(exponent))); }));
    var sum = digitValues.reduce(function (agg, cur) { return agg.add(cur); }, new bn_js_1.default(0));
    return sum.toString(16, 2);
}
exports.decodeB40 = decodeB40;
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
 * @ignore
 */
function addUTXOsToFund(txBuilderIn, utxos, amountToFund, feeRate, fundNewFees) {
    if (fundNewFees === void 0) { fundNewFees = true; }
    if (utxos.length === 0) {
        throw new errors_1.NotEnoughFundsError(amountToFund);
    }
    // how much are we increasing fees by adding an input ?
    var newFees = feeRate * (estimateTXBytes(txBuilderIn, 1, 0)
        - estimateTXBytes(txBuilderIn, 0, 0));
    var utxoThreshhold = amountToFund;
    if (fundNewFees) {
        utxoThreshhold += newFees;
    }
    var goodUtxos = utxos.filter(function (utxo) { return utxo.value >= utxoThreshhold; });
    if (goodUtxos.length > 0) {
        goodUtxos.sort(function (a, b) { return a.value - b.value; });
        var selected = goodUtxos[0];
        var change = selected.value - amountToFund;
        if (fundNewFees) {
            change -= newFees;
        }
        txBuilderIn.addInput(selected.tx_hash, selected.tx_output_n);
        return change;
    }
    else {
        utxos.sort(function (a, b) { return b.value - a.value; });
        var largest = utxos[0];
        if (newFees >= largest.value) {
            throw new errors_1.NotEnoughFundsError(amountToFund);
        }
        txBuilderIn.addInput(largest.tx_hash, largest.tx_output_n);
        var remainToFund = amountToFund - largest.value;
        if (fundNewFees) {
            remainToFund += newFees;
        }
        return addUTXOsToFund(txBuilderIn, utxos.slice(1), remainToFund, feeRate, fundNewFees);
    }
}
exports.addUTXOsToFund = addUTXOsToFund;
function signInputs(txB, defaultSigner, otherSigners) {
    var txInner = getTransactionInsideBuilder(txB);
    var signerArray = txInner.ins.map(function () { return defaultSigner; });
    if (otherSigners) {
        otherSigners.forEach(function (signerPair) {
            signerArray[signerPair.index] = signerPair.signer;
        });
    }
    var signingPromise = Promise.resolve();
    var _loop_1 = function (i) {
        signingPromise = signingPromise.then(function () { return signerArray[i].signTransaction(txB, i); });
    };
    for (var i = 0; i < txInner.ins.length; i++) {
        _loop_1(i);
    }
    return signingPromise.then(function () { return txB; });
}
exports.signInputs = signInputs;
//# sourceMappingURL=utils.js.map