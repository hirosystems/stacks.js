
function doDomainAndPublicKeyMatch(domain, publicKey, resolver) {
    return true
}

function isPublicKeychainInProfile(blockchainid, publicKeychain, resolver) {
    return true
}

function doMasterAndChildKeysMatch(publicKeychain, childPublicKey, chainPath) {
    return true
}

module.exports = {
    doDomainAndPublicKeyMatch: doDomainAndPublicKeyMatch,
    isPublicKeychainInProfile: isPublicKeychainInProfile,
    doMasterAndChildKeysMatch: doMasterAndChildKeysMatch
}