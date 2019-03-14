"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var services_1 = require("./services");
/**
 * Validates the social proofs in a user's profile. Currently supports validation of
 * Facebook, Twitter, GitHub, Instagram, LinkedIn and HackerNews accounts.
 *
 * @param {Object} profile The JSON of the profile to be validated
 * @param {string} ownerAddress The owner bitcoin address to be validated
 * @param {string} [name=null] The Blockstack name to be validated
 * @returns {Promise} that resolves to an array of validated proof objects
 */
function validateProofs(profile, ownerAddress, name) {
    if (name === void 0) { name = null; }
    if (!profile) {
        throw new Error('Profile must not be null');
    }
    var accounts = [];
    var proofsToValidate = [];
    if (profile.hasOwnProperty('account')) {
        accounts = profile.account;
    }
    else {
        return Promise.resolve([]);
    }
    accounts.forEach(function (account) {
        // skip if proof service is not supported
        if (account.hasOwnProperty('service')
            && !services_1.profileServices.hasOwnProperty(account.service)) {
            return;
        }
        if (!(account.hasOwnProperty('proofType')
            && account.proofType === 'http'
            && account.hasOwnProperty('proofUrl'))) {
            return;
        }
        var proof = {
            service: account.service,
            proof_url: account.proofUrl,
            identifier: account.identifier,
            valid: false
        };
        proofsToValidate.push(services_1.profileServices[account.service]
            .validateProof(proof, ownerAddress, name));
    });
    return Promise.all(proofsToValidate);
}
exports.validateProofs = validateProofs;
//# sourceMappingURL=profileProofs.js.map