"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
function isNameValid(fullyQualifiedName) {
    if (fullyQualifiedName === void 0) { fullyQualifiedName = ''; }
    var NAME_PART_RULE = /^[a-z0-9\-_+]+$/;
    var LENGTH_MAX_NAME = 37;
    if (!fullyQualifiedName
        || fullyQualifiedName.length > LENGTH_MAX_NAME) {
        return Promise.resolve(false);
    }
    var nameParts = fullyQualifiedName.split('.');
    if (nameParts.length !== 2) {
        return Promise.resolve(false);
    }
    return Promise.resolve(nameParts.reduce(function (agg, namePart) {
        if (!agg) {
            return false;
        }
        else {
            return NAME_PART_RULE.test(namePart);
        }
    }, true));
}
function isNamespaceValid(namespaceID) {
    var NAMESPACE_RULE = /^[a-z0-9\-_]{1,19}$/;
    return Promise.resolve(namespaceID.match(NAMESPACE_RULE) !== null);
}
function isNameAvailable(fullyQualifiedName) {
    return config_1.config.network.getNameInfo(fullyQualifiedName)
        .then(function () { return false; })
        .catch(function (e) {
        if (e.message === 'Name not found') {
            return true;
        }
        else {
            throw e;
        }
    });
}
function isNamespaceAvailable(namespaceID) {
    return config_1.config.network.getNamespaceInfo(namespaceID)
        .then(function () { return false; })
        .catch(function (e) {
        if (e.message === 'Namespace not found') {
            return true;
        }
        else {
            throw e;
        }
    });
}
function ownsName(fullyQualifiedName, ownerAddress) {
    return config_1.config.network.getNameInfo(fullyQualifiedName)
        .then(function (nameInfo) { return nameInfo.address === ownerAddress; })
        .catch(function (e) {
        if (e.message === 'Name not found') {
            return false;
        }
        else {
            throw e;
        }
    });
}
function revealedNamespace(namespaceID, revealAddress) {
    return config_1.config.network.getNamespaceInfo(namespaceID)
        .then(function (namespaceInfo) { return namespaceInfo.recipient_address === revealAddress; })
        .catch(function (e) {
        if (e.message === 'Namespace not found') {
            return false;
        }
        else {
            throw e;
        }
    });
}
function namespaceIsReady(namespaceID) {
    return config_1.config.network.getNamespaceInfo(namespaceID)
        .then(function (namespaceInfo) { return namespaceInfo.ready; })
        .catch(function (e) {
        if (e.message === 'Namespace not found') {
            return false;
        }
        else {
            throw e;
        }
    });
}
function namespaceIsRevealed(namespaceID) {
    return config_1.config.network.getNamespaceInfo(namespaceID)
        .then(function (namespaceInfo) { return !namespaceInfo.ready; })
        .catch(function (e) {
        if (e.message === 'Namespace not found') {
            return false;
        }
        else {
            throw e;
        }
    });
}
function isInGracePeriod(fullyQualifiedName) {
    var network = config_1.config.network;
    return Promise.all([network.getNameInfo(fullyQualifiedName),
        network.getBlockHeight(),
        network.getGracePeriod(fullyQualifiedName)])
        .then(function (_a) {
        var nameInfo = _a[0], blockHeight = _a[1], gracePeriod = _a[2];
        var expiresAt = nameInfo.expire_block;
        return (blockHeight >= expiresAt) && (blockHeight < (gracePeriod + expiresAt));
    })
        .catch(function (e) {
        if (e.message === 'Name not found') {
            return false;
        }
        else {
            throw e;
        }
    });
}
function addressCanReceiveName(address) {
    return config_1.config.network.getNamesOwned(address)
        .then(function (names) { return (Promise.all(names.map(function (name) { return isNameValid(name); }))
        .then(function (validNames) { return validNames.filter(function (nameValid) { return nameValid; }).length < 25; })); });
}
function isAccountSpendable(address, tokenType, blockHeight) {
    return config_1.config.network.getAccountStatus(address, tokenType)
        .then(function (accountStatus) { return accountStatus.transfer_send_block_id >= blockHeight; });
}
exports.safety = {
    addressCanReceiveName: addressCanReceiveName,
    isInGracePeriod: isInGracePeriod,
    ownsName: ownsName,
    isNameAvailable: isNameAvailable,
    isNameValid: isNameValid,
    isNamespaceValid: isNamespaceValid,
    isNamespaceAvailable: isNamespaceAvailable,
    revealedNamespace: revealedNamespace,
    namespaceIsReady: namespaceIsReady,
    namespaceIsRevealed: namespaceIsRevealed,
    isAccountSpendable: isAccountSpendable
};
//# sourceMappingURL=safety.js.map