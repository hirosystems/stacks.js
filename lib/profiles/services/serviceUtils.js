"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function containsValidProofStatement(searchText, name) {
    if (name === void 0) { name = null; }
    if (!name) {
        return false;
    }
    searchText = searchText.toLowerCase();
    if (name.split('.').length < 2) {
        throw new Error('Please provide the fully qualified Blockstack name.');
    }
    var username = null;
    // support legacy Blockstack ID proofs
    if (name.endsWith('.id')) {
        username = name.split('.id')[0];
    }
    var verificationStyles = username != null ? [
        "verifying myself: my bitcoin username is +" + username,
        "verifying myself: my bitcoin username is " + username,
        "verifying myself: my openname is " + username,
        "verifying that +" + username + " is my bitcoin username",
        "verifying that " + username + " is my bitcoin username",
        "verifying that " + username + " is my openname",
        "verifying that +" + username + " is my openname",
        "verifying i am +" + username + " on my passcard",
        "verifying that +" + username + " is my blockchain id",
        "verifying that \"" + name + "\" is my blockstack id",
        "verifying that " + name + " is my blockstack id",
        "verifying that &quot;" + name + "&quot; is my blockstack id"
    ] : [
        "verifying that \"" + name + "\" is my blockstack id",
        "verifying that " + name + " is my blockstack id",
        "verifying that &quot;" + name + "&quot; is my blockstack id"
    ];
    for (var i = 0; i < verificationStyles.length; i++) {
        var verificationStyle = verificationStyles[i];
        if (searchText.includes(verificationStyle)) {
            return true;
        }
    }
    if (username != null
        && searchText.includes('verifymyonename')
        && searchText.includes("+" + username)) {
        return true;
    }
    return false;
}
exports.containsValidProofStatement = containsValidProofStatement;
function containsValidAddressProofStatement(proofStatement, address) {
    proofStatement = proofStatement.split(address)[0].toLowerCase() + address;
    var verificationStyles = [
        "verifying my blockstack id is secured with the address " + address
    ];
    for (var i = 0; i < verificationStyles.length; i++) {
        var verificationStyle = verificationStyles[i];
        if (proofStatement.includes(verificationStyle)) {
            return true;
        }
    }
    return false;
}
exports.containsValidAddressProofStatement = containsValidAddressProofStatement;
//# sourceMappingURL=serviceUtils.js.map