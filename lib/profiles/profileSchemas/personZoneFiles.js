"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: Could not find a declaration file for module
var zone_file_1 = require("zone-file");
var person_1 = require("./person");
var profileZoneFiles_1 = require("../profileZoneFiles");
var profileTokens_1 = require("../profileTokens");
function resolveZoneFileToPerson(zoneFile, publicKeyOrAddress, callback) {
    var zoneFileJson = null;
    try {
        zoneFileJson = zone_file_1.parseZoneFile(zoneFile);
        if (!zoneFileJson.hasOwnProperty('$origin')) {
            zoneFileJson = null;
            throw new Error('zone file is missing an origin');
        }
    }
    catch (e) {
        console.error(e);
    }
    var tokenFileUrl = null;
    if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
        tokenFileUrl = profileZoneFiles_1.getTokenFileUrl(zoneFileJson);
    }
    else {
        var profile = null;
        try {
            profile = JSON.parse(zoneFile);
            var person = person_1.Person.fromLegacyFormat(profile);
            profile = person.profile();
        }
        catch (error) {
            console.warn(error);
        }
        callback(profile);
        return;
    }
    if (tokenFileUrl) {
        fetch(tokenFileUrl)
            .then(function (response) { return response.text(); })
            .then(function (responseText) { return JSON.parse(responseText); })
            .then(function (responseJson) {
            var tokenRecords = responseJson;
            var token = tokenRecords[0].token;
            var profile = profileTokens_1.extractProfile(token, publicKeyOrAddress);
            callback(profile);
        })
            .catch(function (error) {
            console.warn(error);
        });
    }
    else {
        console.warn('Token file url not found');
        callback({});
    }
}
exports.resolveZoneFileToPerson = resolveZoneFileToPerson;
//# sourceMappingURL=personZoneFiles.js.map