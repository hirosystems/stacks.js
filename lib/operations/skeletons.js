"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var bn_js_1 = __importDefault(require("bn.js"));
var utils_1 = require("./utils");
var config_1 = require("../config");
// todo : add name length / character verification
/**
* @ignore
*/
var BlockstackNamespace = /** @class */ (function () {
    function BlockstackNamespace(namespaceID) {
        if (namespaceID.length > 19) {
            throw new Error('Namespace ID too long (19 chars max)');
        }
        if (!namespaceID.match('[0123456789abcdefghijklmnopqrstuvwxyz_-]+')) {
            throw new Error('Namespace ID can only use characters 0123456789abcdefghijklmnopqrstuvwxyz-_');
        }
        this.namespaceID = namespaceID;
        this.version = -1;
        this.lifetime = -1;
        this.coeff = -1;
        this.base = -1;
        this.buckets = [-1];
        this.nonalphaDiscount = -1;
        this.noVowelDiscount = -1;
    }
    BlockstackNamespace.prototype.check = function () {
        try {
            this.setVersion(this.version);
            this.setLifetime(this.lifetime);
            this.setCoeff(this.coeff);
            this.setBase(this.base);
            this.setBuckets(this.buckets);
            this.setNonalphaDiscount(this.nonalphaDiscount);
            this.setNoVowelDiscount(this.noVowelDiscount);
            return true;
        }
        catch (e) {
            return false;
        }
    };
    BlockstackNamespace.prototype.setVersion = function (version) {
        if (version < 0 || version > Math.pow(2, 16) - 1) {
            throw new Error('Invalid version: must be a 16-bit number');
        }
        this.version = version;
    };
    BlockstackNamespace.prototype.setLifetime = function (lifetime) {
        if (lifetime < 0 || lifetime > Math.pow(2, 32) - 1) {
            throw new Error('Invalid lifetime: must be a 32-bit number');
        }
        this.lifetime = lifetime;
    };
    BlockstackNamespace.prototype.setCoeff = function (coeff) {
        if (coeff < 0 || coeff > 255) {
            throw new Error('Invalid coeff: must be an 8-bit number');
        }
        this.coeff = coeff;
    };
    BlockstackNamespace.prototype.setBase = function (base) {
        if (base < 0 || base > 255) {
            throw new Error('Invalid base: must be an 8-bit number');
        }
        this.base = base;
    };
    BlockstackNamespace.prototype.setBuckets = function (buckets) {
        if (buckets.length !== 16) {
            throw new Error('Invalid buckets: must have 16 entries');
        }
        for (var i = 0; i < buckets.length; i++) {
            if (buckets[i] < 0 || buckets[i] > 15) {
                throw new Error('Invalid buckets: must be 4-bit numbers');
            }
        }
        this.buckets = buckets.slice(0);
    };
    BlockstackNamespace.prototype.setNonalphaDiscount = function (nonalphaDiscount) {
        if (nonalphaDiscount <= 0 || nonalphaDiscount > 15) {
            throw new Error('Invalid nonalphaDiscount: must be a positive 4-bit number');
        }
        this.nonalphaDiscount = nonalphaDiscount;
    };
    BlockstackNamespace.prototype.setNoVowelDiscount = function (noVowelDiscount) {
        if (noVowelDiscount <= 0 || noVowelDiscount > 15) {
            throw new Error('Invalid noVowelDiscount: must be a positive 4-bit number');
        }
        this.noVowelDiscount = noVowelDiscount;
    };
    BlockstackNamespace.prototype.toHexPayload = function () {
        var lifeHex = ("00000000" + this.lifetime.toString(16)).slice(-8);
        var coeffHex = ("00" + this.coeff.toString(16)).slice(-2);
        var baseHex = ("00" + this.base.toString(16)).slice(-2);
        var bucketHex = this.buckets.map(function (b) { return b.toString(16); }).reduce(function (b1, b2) { return b1 + b2; }, '');
        var discountHex = this.nonalphaDiscount.toString(16) + this.noVowelDiscount.toString(16);
        var versionHex = ("0000" + this.version.toString(16)).slice(-4);
        var namespaceIDHex = Buffer.from(this.namespaceID).toString('hex');
        return lifeHex + coeffHex + baseHex + bucketHex + discountHex + versionHex + namespaceIDHex;
    };
    return BlockstackNamespace;
}());
exports.BlockstackNamespace = BlockstackNamespace;
/**
* @ignore
*/
function asAmountV2(amount) {
    // convert an AmountType v1 or v2 to an AmountTypeV2.
    // the "units" of a v1 amount type are always 'BTC'
    if (typeof amount === 'number') {
        return { units: 'BTC', amount: new bn_js_1.default(String(amount)) };
    }
    else {
        return { units: amount.units, amount: amount.amount };
    }
}
/**
* @ignore
*/
function makeTXbuilder() {
    var txb = new bitcoinjs_lib_1.default.TransactionBuilder(config_1.config.network.layer1);
    txb.setVersion(1);
    return txb;
}
/**
* @ignore
*/
function opEncode(opcode) {
    // NOTE: must *always* a 3-character string
    var res = "" + config_1.config.network.MAGIC_BYTES + opcode;
    if (res.length !== 3) {
        throw new Error('Runtime error: invalid MAGIC_BYTES');
    }
    return res;
}
/**
* @ignore
*/
function makePreorderSkeleton(fullyQualifiedName, consensusHash, preorderAddress, burnAddress, burn, registerAddress) {
    if (registerAddress === void 0) { registerAddress = null; }
    // Returns a preorder tx skeleton.
    //   with 3 outputs : 1. the Blockstack Preorder OP_RETURN data
    //                    2. the Preorder's change address (5500 satoshi minimum)
    //                    3. the BURN
    //
    // 0     2  3                                     23             39          47            66
    // |-----|--|--------------------------------------|--------------|-----------|-------------|
    // magic op  hash160(fqn,scriptPubkey,registerAddr) consensus hash token burn  token type
    //                                                                 (optional)   (optional)
    //
    // output 0: name preorder code
    // output 1: preorder address
    // output 2: burn address
    //
    // Returns an unsigned serialized transaction.
    var burnAmount = asAmountV2(burn);
    var network = config_1.config.network;
    var nameBuff = Buffer.from(utils_1.decodeB40(fullyQualifiedName), 'hex'); // base40
    var scriptPublicKey = bitcoinjs_lib_1.default.address.toOutputScript(preorderAddress, network.layer1);
    var dataBuffers = [nameBuff, scriptPublicKey];
    if (!!registerAddress) {
        var registerBuff = Buffer.from(registerAddress, 'ascii');
        dataBuffers.push(registerBuff);
    }
    var dataBuff = Buffer.concat(dataBuffers);
    var hashed = utils_1.hash160(dataBuff);
    var opReturnBufferLen = burnAmount.units === 'BTC' ? 39 : 66;
    var opReturnBuffer = Buffer.alloc(opReturnBufferLen);
    opReturnBuffer.write(opEncode('?'), 0, 3, 'ascii');
    hashed.copy(opReturnBuffer, 3);
    opReturnBuffer.write(consensusHash, 23, 16, 'hex');
    if (burnAmount.units !== 'BTC') {
        var burnHex = burnAmount.amount.toString(16, 2);
        if (burnHex.length > 16) {
            // exceeds 2**64; can't fit
            throw new Error("Cannot preorder '" + fullyQualifiedName + "': cannot fit price into 8 bytes");
        }
        var paddedBurnHex = ("0000000000000000" + burnHex).slice(-16);
        opReturnBuffer.write(paddedBurnHex, 39, 8, 'hex');
        opReturnBuffer.write(burnAmount.units, 47, burnAmount.units.length, 'ascii');
    }
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    tx.addOutput(preorderAddress, utils_1.DUST_MINIMUM);
    if (burnAmount.units === 'BTC') {
        var btcBurnAmount = burnAmount.amount.toNumber();
        tx.addOutput(burnAddress, btcBurnAmount);
    }
    else {
        tx.addOutput(burnAddress, utils_1.DUST_MINIMUM);
    }
    return tx.buildIncomplete();
}
exports.makePreorderSkeleton = makePreorderSkeleton;
/**
* @ignore
*/
function makeRegisterSkeleton(fullyQualifiedName, ownerAddress, valueHash, burnTokenAmountHex) {
    // Returns a register tx skeleton.
    //   with 2 outputs : 1. The register OP_RETURN
    //                    2. The owner address (can be different from REGISTER address on renewals)
    if (valueHash === void 0) { valueHash = null; }
    if (burnTokenAmountHex === void 0) { burnTokenAmountHex = null; }
    // You MUST make the first input a UTXO from the current OWNER *or* the
    //   funder of the PREORDER
    // in the case of a renewal, this would need to be modified to include a change address
    //  as output (3) before the burn output (4)
    /*
      Formats
  
      No zonefile hash, and pay with BTC:
  
      0    2  3                                  39
      |----|--|----------------------------------|
      magic op   name.ns_id (up to 37 bytes)
  
  
      With zonefile hash, and pay with BTC:
  
      0    2  3                                  39                  59
      |----|--|----------------------------------|-------------------|
      magic op   name.ns_id (37 bytes, 0-padded)     zone file hash
  
      output 0: name registration code
      output 1: owner address
    */
    var payload;
    if (!!burnTokenAmountHex && !valueHash) {
        // empty value hash
        valueHash = '0000000000000000000000000000000000000000';
    }
    if (!!valueHash) {
        if (valueHash.length !== 40) {
            throw new Error('Value hash length incorrect. Expecting 20-bytes, hex-encoded');
        }
        if (!!burnTokenAmountHex) {
            if (burnTokenAmountHex.length !== 16) {
                throw new Error('Burn field length incorrect.  Expecting 8-bytes, hex-encoded');
            }
        }
        var payloadLen = burnTokenAmountHex ? 65 : 57;
        payload = Buffer.alloc(payloadLen, 0);
        payload.write(fullyQualifiedName, 0, 37, 'ascii');
        payload.write(valueHash, 37, 20, 'hex');
        if (!!burnTokenAmountHex) {
            payload.write(burnTokenAmountHex, 57, 8, 'hex');
        }
    }
    else {
        payload = Buffer.from(fullyQualifiedName, 'ascii');
    }
    var opReturnBuffer = Buffer.concat([Buffer.from(opEncode(':'), 'ascii'), payload]);
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    tx.addOutput(ownerAddress, utils_1.DUST_MINIMUM);
    return tx.buildIncomplete();
}
exports.makeRegisterSkeleton = makeRegisterSkeleton;
/**
* @ignore
*/
function makeRenewalSkeleton(fullyQualifiedName, nextOwnerAddress, lastOwnerAddress, burnAddress, burn, valueHash) {
    if (valueHash === void 0) { valueHash = null; }
    /*
      Formats
  
      No zonefile hash, and pay with BTC:
  
      0    2  3                                  39
      |----|--|----------------------------------|
      magic op   name.ns_id (up to 37 bytes)
  
  
      With zonefile hash, and pay with BTC:
  
      0    2  3                                  39                  59
      |----|--|----------------------------------|-------------------|
      magic op   name.ns_id (37 bytes, 0-padded)     zone file hash
  
  
     With renewal payment in a token:
     (for register, tokens burned is not included)
     (for renew, tokens burned is the number of tokens to burn)
  
     0    2  3                                  39                  59                            67
     |----|--|----------------------------------|-------------------|------------------------------|
     magic op   name.ns_id (37 bytes, 0-padded)     zone file hash    tokens burned (big-endian)
  
     output 0: renewal code
     output 1: new owner address
     output 2: current owner address
     output 3: burn address
    */
    var burnAmount = asAmountV2(burn);
    var network = config_1.config.network;
    var burnTokenAmount = burnAmount.units === 'BTC' ? null : burnAmount.amount;
    var burnBTCAmount = burnAmount.units === 'BTC'
        ? burnAmount.amount.toNumber() : utils_1.DUST_MINIMUM;
    var burnTokenHex = null;
    if (!!burnTokenAmount) {
        var burnHex = burnTokenAmount.toString(16, 2);
        if (burnHex.length > 16) {
            // exceeds 2**64; can't fit 
            throw new Error("Cannot renew '" + fullyQualifiedName + "': cannot fit price into 8 bytes");
        }
        burnTokenHex = ("0000000000000000" + burnHex).slice(-16);
    }
    var registerTX = makeRegisterSkeleton(fullyQualifiedName, nextOwnerAddress, valueHash, burnTokenHex);
    var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(registerTX, network.layer1);
    txB.addOutput(lastOwnerAddress, utils_1.DUST_MINIMUM);
    txB.addOutput(burnAddress, burnBTCAmount);
    return txB.buildIncomplete();
}
exports.makeRenewalSkeleton = makeRenewalSkeleton;
/**
* @ignore
*/
function makeTransferSkeleton(fullyQualifiedName, consensusHash, newOwner, keepZonefile) {
    if (keepZonefile === void 0) { keepZonefile = false; }
    // Returns a transfer tx skeleton.
    //   with 2 outputs : 1. the Blockstack Transfer OP_RETURN data
    //                    2. the new owner with a DUST_MINIMUM value (5500 satoshi)
    //
    // You MUST make the first input a UTXO from the current OWNER
    //
    // Returns an unsigned serialized transaction.
    /*
      Format
  
      0     2  3    4                   20              36
      |-----|--|----|-------------------|---------------|
      magic op keep  hash128(name.ns_id) consensus hash
               data?
  
      output 0: transfer code
      output 1: new owner
    */
    var opRet = Buffer.alloc(36);
    var keepChar = '~';
    if (keepZonefile) {
        keepChar = '>';
    }
    opRet.write(opEncode('>'), 0, 3, 'ascii');
    opRet.write(keepChar, 3, 1, 'ascii');
    var hashed = utils_1.hash128(Buffer.from(fullyQualifiedName, 'ascii'));
    hashed.copy(opRet, 4);
    opRet.write(consensusHash, 20, 16, 'hex');
    var opRetPayload = bitcoinjs_lib_1.default.payments.embed({ data: [opRet] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(opRetPayload, 0);
    tx.addOutput(newOwner, utils_1.DUST_MINIMUM);
    return tx.buildIncomplete();
}
exports.makeTransferSkeleton = makeTransferSkeleton;
/**
* @ignore
*/
function makeUpdateSkeleton(fullyQualifiedName, consensusHash, valueHash) {
    // Returns an update tx skeleton.
    //   with 1 output : 1. the Blockstack update OP_RETURN
    //
    // You MUST make the first input a UTXO from the current OWNER
    //
    // Returns an unsigned serialized transaction.
    //
    // output 0: the revoke code
    /*
      Format:
  
      0     2  3                                   19                      39
      |-----|--|-----------------------------------|-----------------------|
      magic op  hash128(name.ns_id,consensus hash) hash160(data)
  
      output 0: update code
    */
    var opRet = Buffer.alloc(39);
    var nameBuff = Buffer.from(fullyQualifiedName, 'ascii');
    var consensusBuff = Buffer.from(consensusHash, 'ascii');
    var hashedName = utils_1.hash128(Buffer.concat([nameBuff, consensusBuff]));
    opRet.write(opEncode('+'), 0, 3, 'ascii');
    hashedName.copy(opRet, 3);
    opRet.write(valueHash, 19, 20, 'hex');
    var opRetPayload = bitcoinjs_lib_1.default.payments.embed({ data: [opRet] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(opRetPayload, 0);
    return tx.buildIncomplete();
}
exports.makeUpdateSkeleton = makeUpdateSkeleton;
/**
* @ignore
*/
function makeRevokeSkeleton(fullyQualifiedName) {
    // Returns a revoke tx skeleton
    //    with 1 output: 1. the Blockstack revoke OP_RETURN
    //
    // You MUST make the first input a UTXO from the current OWNER
    //
    // Returns an unsigned serialized transaction
    /*
     Format:
  
     0    2  3                             39
     |----|--|-----------------------------|
     magic op   name.ns_id (37 bytes)
  
     output 0: the revoke code
    */
    var opRet = Buffer.alloc(3);
    var nameBuff = Buffer.from(fullyQualifiedName, 'ascii');
    opRet.write(opEncode('~'), 0, 3, 'ascii');
    var opReturnBuffer = Buffer.concat([opRet, nameBuff]);
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    return tx.buildIncomplete();
}
exports.makeRevokeSkeleton = makeRevokeSkeleton;
/**
* @ignore
*/
function makeNamespacePreorderSkeleton(namespaceID, consensusHash, preorderAddress, registerAddress, burn) {
    // Returns a namespace preorder tx skeleton.
    // Returns an unsigned serialized transaction.
    /*
     Formats:
  
     Without STACKS:
  
     0     2   3                                      23               39
     |-----|---|--------------------------------------|----------------|
     magic op  hash(ns_id,script_pubkey,reveal_addr)   consensus hash
  
  
     with STACKs:
  
     0     2   3                                      23               39                         47
     |-----|---|--------------------------------------|----------------|--------------------------|
     magic op  hash(ns_id,script_pubkey,reveal_addr)   consensus hash    token fee (big-endian)
  
     output 0: namespace preorder code
     output 1: change address
     otuput 2: burn address
    */
    var burnAmount = asAmountV2(burn);
    if (burnAmount.units !== 'BTC' && burnAmount.units !== 'STACKS') {
        throw new Error("Invalid burnUnits " + burnAmount.units);
    }
    var network = config_1.config.network;
    var burnAddress = network.getDefaultBurnAddress();
    var namespaceIDBuff = Buffer.from(utils_1.decodeB40(namespaceID), 'hex'); // base40
    var scriptPublicKey = bitcoinjs_lib_1.default.address.toOutputScript(preorderAddress, network.layer1);
    var registerBuff = Buffer.from(registerAddress, 'ascii');
    var dataBuffers = [namespaceIDBuff, scriptPublicKey, registerBuff];
    var dataBuff = Buffer.concat(dataBuffers);
    var hashed = utils_1.hash160(dataBuff);
    var btcBurnAmount = utils_1.DUST_MINIMUM;
    var opReturnBufferLen = 39;
    if (burnAmount.units === 'STACKS') {
        opReturnBufferLen = 47;
    }
    else {
        btcBurnAmount = burnAmount.amount.toNumber();
    }
    var opReturnBuffer = Buffer.alloc(opReturnBufferLen);
    opReturnBuffer.write(opEncode('*'), 0, 3, 'ascii');
    hashed.copy(opReturnBuffer, 3);
    opReturnBuffer.write(consensusHash, 23, 16, 'hex');
    if (burnAmount.units === 'STACKS') {
        var burnHex = burnAmount.amount.toString(16, 2);
        var paddedBurnHex = ("0000000000000000" + burnHex).slice(-16);
        opReturnBuffer.write(paddedBurnHex, 39, 8, 'hex');
    }
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    tx.addOutput(preorderAddress, utils_1.DUST_MINIMUM);
    tx.addOutput(burnAddress, btcBurnAmount);
    return tx.buildIncomplete();
}
exports.makeNamespacePreorderSkeleton = makeNamespacePreorderSkeleton;
/**
* @ignore
*/
function makeNamespaceRevealSkeleton(namespace, revealAddress) {
    /*
     Format:
  
     0     2   3    7     8     9    10   11   12   13   14    15    16    17       18      20     39
     |-----|---|----|-----|-----|----|----|----|----|----|-----|-----|-----|--------|-------|-------|
     magic  op  life coeff. base 1-2  3-4  5-6  7-8  9-10 11-12 13-14 15-16 nonalpha version  ns ID
                                                    bucket exponents        no-vowel
                                                                            discounts
     
     output 0: namespace reveal code
     output 1: reveal address
    */
    var hexPayload = namespace.toHexPayload();
    var opReturnBuffer = Buffer.alloc(3 + hexPayload.length / 2);
    opReturnBuffer.write(opEncode('&'), 0, 3, 'ascii');
    opReturnBuffer.write(hexPayload, 3, hexPayload.length / 2, 'hex');
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    tx.addOutput(revealAddress, utils_1.DUST_MINIMUM);
    return tx.buildIncomplete();
}
exports.makeNamespaceRevealSkeleton = makeNamespaceRevealSkeleton;
/**
* @ignore
*/
function makeNamespaceReadySkeleton(namespaceID) {
    /*
     Format:
  
     0     2  3  4           23
     |-----|--|--|------------|
     magic op  .  ns_id
  
     output 0: namespace ready code
     */
    var opReturnBuffer = Buffer.alloc(3 + namespaceID.length + 1);
    opReturnBuffer.write(opEncode('!'), 0, 3, 'ascii');
    opReturnBuffer.write("." + namespaceID, 3, namespaceID.length + 1, 'ascii');
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    return tx.buildIncomplete();
}
exports.makeNamespaceReadySkeleton = makeNamespaceReadySkeleton;
// type bitcoin.payments.p2data bitcoin.payments.embed
/**
* @ignore
*/
function makeNameImportSkeleton(name, recipientAddr, zonefileHash) {
    /*
     Format:
  
      0    2  3                             39
      |----|--|-----------------------------|
      magic op   name.ns_id (37 bytes)
  
     Output 0: the OP_RETURN
     Output 1: the recipient
     Output 2: the zonefile hash
   */
    if (zonefileHash.length !== 40) {
        throw new Error('Invalid zonefile hash: must be 20 bytes hex-encoded');
    }
    var network = config_1.config.network;
    var opReturnBuffer = Buffer.alloc(3 + name.length);
    opReturnBuffer.write(opEncode(';'), 0, 3, 'ascii');
    opReturnBuffer.write(name, 3, name.length, 'ascii');
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    var zonefileHashB58 = bitcoinjs_lib_1.default.address.toBase58Check(Buffer.from(zonefileHash, 'hex'), network.layer1.pubKeyHash);
    tx.addOutput(nullOutput, 0);
    tx.addOutput(recipientAddr, utils_1.DUST_MINIMUM);
    tx.addOutput(zonefileHashB58, utils_1.DUST_MINIMUM);
    return tx.buildIncomplete();
}
exports.makeNameImportSkeleton = makeNameImportSkeleton;
/**
* @ignore
*/
function makeAnnounceSkeleton(messageHash) {
    /*
      Format:
  
      0    2  3                             23
      |----|--|-----------------------------|
      magic op   message hash (160-bit)
  
      output 0: the OP_RETURN
    */
    if (messageHash.length !== 40) {
        throw new Error('Invalid message hash: must be 20 bytes hex-encoded');
    }
    var opReturnBuffer = Buffer.alloc(3 + messageHash.length / 2);
    opReturnBuffer.write(opEncode('#'), 0, 3, 'ascii');
    opReturnBuffer.write(messageHash, 3, messageHash.length / 2, 'hex');
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    return tx.buildIncomplete();
}
exports.makeAnnounceSkeleton = makeAnnounceSkeleton;
/**
* @ignore
*/
function makeTokenTransferSkeleton(recipientAddress, consensusHash, tokenType, tokenAmount, scratchArea) {
    /*
     Format:
  
      0     2  3              19         38          46                        80
      |-----|--|--------------|----------|-----------|-------------------------|
      magic op  consensus_hash token_type amount (BE) scratch area
                               (ns_id)
  
      output 0: token transfer code
      output 1: recipient address
    */
    if (scratchArea.length > 34) {
        throw new Error('Invalid scratch area: must be no more than 34 bytes');
    }
    var opReturnBuffer = Buffer.alloc(46 + scratchArea.length);
    var tokenTypeHex = Buffer.from(tokenType).toString('hex');
    var tokenTypeHexPadded = ("00000000000000000000000000000000000000" + tokenTypeHex).slice(-38);
    var tokenValueHex = tokenAmount.toString(16, 2);
    if (tokenValueHex.length > 16) {
        // exceeds 2**64; can't fit
        throw new Error("Cannot send tokens: cannot fit " + tokenAmount.toString() + " into 8 bytes");
    }
    var tokenValueHexPadded = ("0000000000000000" + tokenValueHex).slice(-16);
    opReturnBuffer.write(opEncode('$'), 0, 3, 'ascii');
    opReturnBuffer.write(consensusHash, 3, consensusHash.length / 2, 'hex');
    opReturnBuffer.write(tokenTypeHexPadded, 19, tokenTypeHexPadded.length / 2, 'hex');
    opReturnBuffer.write(tokenValueHexPadded, 38, tokenValueHexPadded.length / 2, 'hex');
    opReturnBuffer.write(scratchArea, 46, scratchArea.length, 'ascii');
    var nullOutput = bitcoinjs_lib_1.default.payments.embed({ data: [opReturnBuffer] }).output;
    var tx = makeTXbuilder();
    tx.addOutput(nullOutput, 0);
    tx.addOutput(recipientAddress, utils_1.DUST_MINIMUM);
    return tx.buildIncomplete();
}
exports.makeTokenTransferSkeleton = makeTokenTransferSkeleton;
//# sourceMappingURL=skeletons.js.map