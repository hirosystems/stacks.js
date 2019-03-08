"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var profileZoneFiles_1 = require("./profileZoneFiles");
var config_1 = require("../config");
/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username - The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, lookupProfile will use the
 * blockstack.js getNameInfo function.
 * @returns {Promise} that resolves to a profile object
 */
function lookupProfile(username, zoneFileLookupURL) {
    if (zoneFileLookupURL === void 0) { zoneFileLookupURL = null; }
    if (!username) {
        return Promise.reject();
    }
    var lookupPromise;
    if (zoneFileLookupURL) {
        var url = zoneFileLookupURL.replace(/\/$/, '') + "/" + username;
        lookupPromise = fetch(url)
            .then(function (response) { return response.json(); });
    }
    else {
        lookupPromise = config_1.config.network.getNameInfo(username);
    }
    return lookupPromise
        .then(function (responseJSON) {
        if (responseJSON.hasOwnProperty('zonefile')
            && responseJSON.hasOwnProperty('address')) {
            return profileZoneFiles_1.resolveZoneFileToProfile(responseJSON.zonefile, responseJSON.address);
        }
        else {
            throw new Error('Invalid zonefile lookup response: did not contain `address`'
                + ' or `zonefile` field');
        }
    });
}
exports.lookupProfile = lookupProfile;
//# sourceMappingURL=profileLookup.js.map