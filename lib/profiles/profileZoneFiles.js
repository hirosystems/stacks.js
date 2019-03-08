"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: Could not find a declaration file for module
var zone_file_1 = require("zone-file");
var profileTokens_1 = require("./profileTokens");
var index_1 = require("./index");
var logger_1 = require("../logger");
function makeProfileZoneFile(origin, tokenFileUrl) {
    if (tokenFileUrl.indexOf('://') < 0) {
        throw new Error('Invalid token file url');
    }
    var urlScheme = tokenFileUrl.split('://')[0];
    var urlParts = tokenFileUrl.split('://')[1].split('/');
    var domain = urlParts[0];
    var pathname = "/" + urlParts.slice(1).join('/');
    var zoneFile = {
        $origin: origin,
        $ttl: 3600,
        uri: [
            {
                name: '_http._tcp',
                priority: 10,
                weight: 1,
                target: urlScheme + "://" + domain + pathname
            }
        ]
    };
    var zoneFileTemplate = '{$origin}\n{$ttl}\n{uri}\n';
    return zone_file_1.makeZoneFile(zoneFile, zoneFileTemplate);
}
exports.makeProfileZoneFile = makeProfileZoneFile;
function getTokenFileUrl(zoneFileJson) {
    if (!zoneFileJson.hasOwnProperty('uri')) {
        return null;
    }
    if (!Array.isArray(zoneFileJson.uri)) {
        return null;
    }
    if (zoneFileJson.uri.length < 1) {
        return null;
    }
    var firstUriRecord = zoneFileJson.uri[0];
    if (!firstUriRecord.hasOwnProperty('target')) {
        return null;
    }
    var tokenFileUrl = firstUriRecord.target;
    if (tokenFileUrl.startsWith('https')) {
        // pass
    }
    else if (tokenFileUrl.startsWith('http')) {
        // pass
    }
    else {
        tokenFileUrl = "https://" + tokenFileUrl;
    }
    return tokenFileUrl;
}
exports.getTokenFileUrl = getTokenFileUrl;
function resolveZoneFileToProfile(zoneFile, publicKeyOrAddress) {
    return new Promise(function (resolve, reject) {
        var zoneFileJson = null;
        try {
            zoneFileJson = zone_file_1.parseZoneFile(zoneFile);
            if (!zoneFileJson.hasOwnProperty('$origin')) {
                zoneFileJson = null;
            }
        }
        catch (e) {
            reject(e);
        }
        var tokenFileUrl = null;
        if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
            tokenFileUrl = getTokenFileUrl(zoneFileJson);
        }
        else {
            var profile = null;
            try {
                profile = JSON.parse(zoneFile);
                profile = index_1.Person.fromLegacyFormat(profile).profile();
            }
            catch (error) {
                reject(error);
            }
            resolve(profile);
            return;
        }
        if (tokenFileUrl) {
            fetch(tokenFileUrl)
                .then(function (response) { return response.text(); })
                .then(function (responseText) { return JSON.parse(responseText); })
                .then(function (responseJson) {
                var tokenRecords = responseJson;
                var profile = profileTokens_1.extractProfile(tokenRecords[0].token, publicKeyOrAddress);
                resolve(profile);
            })
                .catch(function (error) {
                logger_1.Logger.error("resolveZoneFileToProfile: error fetching token file " + tokenFileUrl + ": " + error);
                reject(error);
            });
        }
        else {
            logger_1.Logger.debug('Token file url not found. Resolving to blank profile.');
            resolve({});
        }
    });
}
exports.resolveZoneFileToProfile = resolveZoneFileToProfile;
//# sourceMappingURL=profileZoneFiles.js.map