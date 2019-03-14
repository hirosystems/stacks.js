"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
/**
* @ignore
*/
function makeDIDFromAddress(address) {
    return "did:btc-addr:" + address;
}
exports.makeDIDFromAddress = makeDIDFromAddress;
/**
* @ignore
*/
function makeDIDFromPublicKey(publicKey) {
    return "did:ecdsa-pub:" + publicKey;
}
exports.makeDIDFromPublicKey = makeDIDFromPublicKey;
/**
* @ignore
*/
function getDIDType(decentralizedID) {
    var didParts = decentralizedID.split(':');
    if (didParts.length !== 3) {
        throw new errors_1.InvalidDIDError('Decentralized IDs must have 3 parts');
    }
    if (didParts[0].toLowerCase() !== 'did') {
        throw new errors_1.InvalidDIDError('Decentralized IDs must start with "did"');
    }
    return didParts[1].toLowerCase();
}
exports.getDIDType = getDIDType;
/**
* @ignore
*/
function getAddressFromDID(decentralizedID) {
    var didType = getDIDType(decentralizedID);
    if (didType === 'btc-addr') {
        return decentralizedID.split(':')[2];
    }
    else {
        return null;
    }
}
exports.getAddressFromDID = getAddressFromDID;
/*
export function getPublicKeyOrAddressFromDID(decentralizedID) {
  const didParts = decentralizedID.split(':')

  if (didParts.length !== 3) {
    throw new InvalidDIDError('Decentralized IDs must have 3 parts')
  }

  if (didParts[0].toLowerCase() !== 'did') {
    throw new InvalidDIDError('Decentralized IDs must start with "did"')
  }

  if (didParts[1].toLowerCase() === 'ecdsa-pub') {
    return didParts[2]
  } else if (didParts[1].toLowerCase() === 'btc-addr') {
    return didParts[2]
  } else {
    throw new InvalidDIDError('Decentralized ID format not supported')
  }
}
*/
//# sourceMappingURL=dids.js.map