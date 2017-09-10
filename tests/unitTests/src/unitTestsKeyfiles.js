import test from 'tape'
import fs from 'fs'
import { ECPair } from 'bitcoinjs-lib'
import FetchMock from 'fetch-mock'

import {
  signProfileToken,
  wrapProfileToken,
  verifyProfileToken,
  extractProfile,
  Profile,
  Person,
  Organization,
  CreativeWork,
  getEntropy,
  makeZoneFileForHostedProfile,
  resolveZoneFileToPerson,
  makeProfileZoneFile,
  publicKeyToAddress,
  getPubkeyHex,
  keyFileCreate,
  keyFileSign,
  keyFileParse,
  keyFileUpdateProfile,
  keyFileUpdateApps,
  keyFileUpdateDelegation,
  keyFileMakeDelegationPrivateKeys,
  keyFileMakeDelegationEntry,
  keyFileGetDelegatedDevicePubkeys,
  keyFileGetSigningPublicKeys,
  keyFileGetAppListing,
  keyFileICANNToAppName,
  keyFileProfileSerialize,
  decodePrivateKey,
  deriveIdentityKeyPair,
  getIdentityPrivateKeychain,
  getIdentityOwnerAddressNode,
  makeFullyQualifiedDataId
} from '../../../lib'

import { sampleProfiles, sampleProofs, sampleVerifications, sampleTokenFiles } from './sampleData'

const bitcoinjs = require('bitcoinjs-lib');
const BigInteger = require('bigi');
const jsontokens = require('jsontokens');

// Go home javascript, you're drunk.
// https://stackoverflow.com/questions/1068834/object-comparison-in-javascript
function deepCompare () {
  var i, l, leftChain, rightChain;

  function compare2Objects (x, y) {
    var p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
         return true;
    }

    // Compare primitives and functions.     
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
        return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
       (x instanceof Date && y instanceof Date) ||
       (x instanceof RegExp && y instanceof RegExp) ||
       (x instanceof String && y instanceof String) ||
       (x instanceof Number && y instanceof Number)) {
        return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
        return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
        return false;
    }

    if (x.constructor !== y.constructor) {
        return false;
    }

    if (x.prototype !== y.prototype) {
        return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
         return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        else if (typeof y[p] !== typeof x[p]) {
            return false;
        }
    }

    for (p in x) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        else if (typeof y[p] !== typeof x[p]) {
            return false;
        }

        switch (typeof (x[p])) {
            case 'object':
            case 'function':

                leftChain.push(x);
                rightChain.push(y);

                if (!compare2Objects (x[p], y[p])) {
                    return false;
                }

                leftChain.pop();
                rightChain.pop();
                break;

            default:
                if (x[p] !== y[p]) {
                    return false;
                }
                break;
        }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {

      leftChain = []; //Todo: this can be cached
      rightChain = [];

      if (!compare2Objects(arguments[0], arguments[i])) {
          return false;
      }
  }

  return true;
}


function testKeyFileCreate(profile, apps) {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229';
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69';
  const masterKeychain = new bitcoinjs.HDNode(new bitcoinjs.ECPair(BigInteger.fromBuffer(decodePrivateKey(privateKey))), Buffer.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]));
  const device_id = 'mydevice';

  const app_name = 'foo.com.1';
  const app_name_2 = 'bar.com.1';
  const app_privkey = 'b4f48cc184dbdf4e7ce62b161a3f566a708cb5de4803bbbc4a5681c9d2bf5da3';
  const app_privkey_2 = 'bf59ba5cc5964bb9adaaec555dc00842a261bfa10ec215c11a40cb01b4524e82';
  const app_pubkey_uncompressed = '04eb05a2f40e045c4dfa106ca9fa0b96daa189a508748b8b015a7883cbbf798bbc9ba64e1568685924331f6697eb080bd7f381bb009984f2560ef2bf06a2c7f26f';
  const app_pubkey_uncompressed_2 = '041382f57dd729a3a6b5a510d5619c80f665b6b89f4b95df5a403bee45cb7b5bf029d44f9ad7b1516828a3bb2b4156a4df16e5ded78352fbf5ea9c749d7e3f38ce';
  const app_pubkey = '03eb05a2f40e045c4dfa106ca9fa0b96daa189a508748b8b015a7883cbbf798bbc';
  const app_pubkey_2 = '021382f57dd729a3a6b5a510d5619c80f665b6b89f4b95df5a403bee45cb7b5bf0';
  const app_datastore_id = '1Jw7yUHbwUDLBKcRk8kcajYf3CqT1vJqj1';
  const app_datastore_id_2 = '1KxAUXd9xfXS9a9K6qhYgu5N7ZjjWvWaLn';

  const identity_master_keychain = getIdentityPrivateKeychain(masterKeychain);
  const identity_owner_node = getIdentityOwnerAddressNode(identity_master_keychain, 0);
  const identity_keypair = deriveIdentityKeyPair(identity_owner_node);
  const master_privkey_info = keyFileMakeDelegationPrivateKeys(identity_keypair, 0);
  const address = publicKeyToAddress(getPubkeyHex(master_privkey_info['owner']))

  test('keyFileCreate', (t) => {

     let keyfile = keyFileCreate("hello.id", identity_keypair, device_id, {'profile': profile, 'apps': apps});
     t.ok(keyfile, 'Key file must have been created');

     let parsed_keyfile = keyFileParse(keyfile, address);
     t.ok(parsed_keyfile, 'Key file must have been parsed');

     // check that the profile, delegations, signing keys, and apps bundles are all preserved
     let key_info = keyFileMakeDelegationEntry(identity_keypair, 0);

     // if no profile is given, then a default one is used.
     if (!profile) {
        profile = {'@type': 'Person', 'accounts': []};
     }

     let delegation = {'version': '1.0', 'name': 'hello.id', 'timestamp': 12345678, 'devices': {}};
     delegation['devices'][device_id] = {'app': key_info['app'], 'enc': key_info['enc'], 'sign': key_info['sign'], 'index': 0};

     profile['keyfile'] = parsed_keyfile.profile.keyfile;

     if (!profile.timestamp) {
        delete parsed_keyfile.profile.timestamp;
     }

     let equal = deepCompare(parsed_keyfile.profile, profile);
     t.ok(equal, 'Profile was must have been preserved');

     let delegated_pubkeys = keyFileGetDelegatedDevicePubkeys(parsed_keyfile);
     t.ok(delegated_pubkeys, 'Delegation public keys exist');
     t.ok(deepCompare(Object.keys(delegated_pubkeys), Object.keys(delegation['devices'])), 'Devices in delegation match');

     let valid = true;
     for (let dev_id of Object.keys(delegated_pubkeys)) {
        valid = valid && 
                delegated_pubkeys[dev_id]['sign'] === delegation['devices'][dev_id]['sign'] &&
                delegated_pubkeys[dev_id]['app'] === delegation['devices'][dev_id]['app'] &&
                delegated_pubkeys[dev_id]['enc'] === delegation['devices'][dev_id]['enc'];

     }
     if (!valid) {
        console.log(delegated_pubkeys);
        console.log(delegation);
     }

     t.ok(valid, 'Delegation must have matched key file');

     let signing_pubkeys = keyFileGetSigningPublicKeys(parsed_keyfile);
     let expected_signing_pubkeys = {};
     expected_signing_pubkeys[device_id] = key_info['sign'];

     t.ok(deepCompare(signing_pubkeys, expected_signing_pubkeys), 'Signing keys must have matched key file');

     // should be empty
     let app_info = keyFileGetAppListing(parsed_keyfile, 'foo.com.1');
     t.ok(deepCompare(app_info, {}), 'App bundle must match the key file');
     t.end();
  });

  test('keyFileUpdateProfile', (t) => {

     let keyfile = keyFileCreate('hello.id', identity_keypair, device_id);
     t.ok(keyfile, 'Key file must have been created');

     let parsed_keyfile = keyFileParse(keyfile, address);
     t.ok(parsed_keyfile, 'Key file must have been parsed');

     let privkey_info = keyFileMakeDelegationPrivateKeys(identity_keypair, 0);

     if (!profile) {
        profile = {'@type': 'Person', 'accounts': [], 'updated': 'yup'};
     }

     let new_keyfile = keyFileUpdateProfile(parsed_keyfile, profile, privkey_info['sign']);
     t.ok(new_keyfile, 'Key file must have been updated');

     parsed_keyfile = keyFileParse(new_keyfile, address);
     t.ok(parsed_keyfile, 'New key file must have been parsed');

     t.ok(deepCompare(parsed_keyfile.profile, profile), 'profiles match');

     // make sure we can decode, reserialize, and reparse the profile 
     let decoded_profile = jsontokens.decodeToken(keyfile).payload.claim;
     t.ok(decoded_profile, 'Key file decodes to a profile')

     let profile_token = keyFileProfileSerialize(profile, privkey_info['sign'])
     parsed_keyfile = keyFileParse(profile_token, address);
     t.ok(parsed_keyfile, 'Key file must have been parsed after decoding and resigning')

     t.end();
  });

  test('keyFileUpdateDelegation', (t) => {

     let keyfile = keyFileCreate('hello.id', identity_keypair, device_id);
     t.ok(keyfile, 'Key file must have been created');

     let parsed_keyfile = keyFileParse(keyfile, address);
     t.ok(parsed_keyfile, 'Key file must have been parsed');

     profile = parsed_keyfile.profile;

     let privkey_info = keyFileMakeDelegationPrivateKeys(identity_keypair, 1);

     // check that the profile, delegations, signing keys, and apps bundles are all preserved
     let new_key_info = keyFileMakeDelegationEntry(identity_keypair, 1);

     let delegation = {};
     delegation[device_id] = {'app': new_key_info['app'], 'enc': new_key_info['enc'], 'sign': new_key_info['sign'], 'index': 1};

     let new_keyfile = keyFileUpdateDelegation(parsed_keyfile, delegation, [privkey_info['owner']], privkey_info['sign']);
     t.ok(new_keyfile, 'Key file must have been updated');

     let new_address = publicKeyToAddress(getPubkeyHex(privkey_info['owner']));
     parsed_keyfile = keyFileParse(new_keyfile, new_address);
     t.ok(parsed_keyfile, 'New key file must have been parsed');

     let delegation_pubkeys = keyFileGetDelegatedDevicePubkeys(parsed_keyfile);
     t.ok(delegation_pubkeys, 'Delegation pubkeys must have been returned');
     t.ok(deepCompare(Object.keys(delegation_pubkeys), Object.keys(delegation)), 'Devices in delegation match');

     let valid = true;
     for (let dev_id of Object.keys(delegation_pubkeys)) {
        valid = valid && 
                delegation_pubkeys[dev_id]['sign'] === delegation[dev_id]['sign'] &&
                delegation_pubkeys[dev_id]['app'] === delegation[dev_id]['app'] &&
                delegation_pubkeys[dev_id]['enc'] === delegation[dev_id]['enc'];
     }
     if (!valid) {
        console.log(delegation_pubkeys);
        console.log(delegation);
     }

     t.ok(valid, 'Delegation must have matched key file');

     t.ok(deepCompare(parsed_keyfile.profile, profile), 'profiles still match');
     t.end();
  });

  test('keyFileUpdateApps', (t) => {

     let keyfile = keyFileCreate('hello.id', identity_keypair, device_id);
     t.ok(keyfile, 'Key file must have been created');

     let parsed_keyfile = keyFileParse(keyfile, address);
     t.ok(parsed_keyfile, 'Key file must have been parsed');
     
     profile = parsed_keyfile.profile;

     let privkey_info = keyFileMakeDelegationPrivateKeys(identity_keypair, 0);

     // insert an app 
     let new_keyfile = keyFileUpdateApps(parsed_keyfile, device_id, app_name, app_pubkey, device_id, app_datastore_id, ['http://example.com/app.datastore'], ['http://example.com/app.root'], privkey_info['sign']);
     t.ok(new_keyfile, 'Key file must have been updated');

     // make sure it's there 
     parsed_keyfile = keyFileParse(new_keyfile, address);
     t.ok(parsed_keyfile, 'New key file must have been parsed');

     let app_info = keyFileGetAppListing(parsed_keyfile, app_name);
     t.ok(app_info, 'App listing must be present');

     let expected_app_listing = {};
     expected_app_listing[device_id] = {
        'public_key': app_pubkey_uncompressed,
        'root_urls': ['http://example.com/app.root'],
        'datastore_urls': ['http://example.com/app.datastore'],
        'fq_datastore_id': makeFullyQualifiedDataId(device_id, `${app_datastore_id}.datastore`),
     };
     
     t.ok(deepCompare(app_info, expected_app_listing), 'App listing must match key file')
     t.ok(deepCompare(parsed_keyfile.profile, profile), 'profiles still match');

     // insert another app 
     new_keyfile = keyFileUpdateApps(parsed_keyfile, device_id, app_name_2, app_pubkey_2, device_id, app_datastore_id_2, ['http://example.com/app2.datastore'], ['http://example.com/app2.root'], privkey_info['sign']);
     t.ok(new_keyfile, 'Key file must have been updated again');

     // make sure it's there 
     parsed_keyfile = keyFileParse(new_keyfile, address);
     t.ok(parsed_keyfile, 'New key file must have been parsed');

     profile = parsed_keyfile.profile;

     app_info = keyFileGetAppListing(parsed_keyfile, app_name);
     t.ok(app_info, 'App listing must be present');
     
     let app_info_2 = keyFileGetAppListing(parsed_keyfile, app_name_2);
     t.ok(app_info_2, 'App listing 2 must be present');

     expected_app_listing = {};
     expected_app_listing[device_id] = {
        'public_key': app_pubkey_uncompressed,
        'root_urls': ['http://example.com/app.root'],
        'datastore_urls': ['http://example.com/app.datastore'],
        'fq_datastore_id': makeFullyQualifiedDataId(device_id, `${app_datastore_id}.datastore`),
     };

     t.ok(deepCompare(app_info, expected_app_listing), 'App listing must match key file, after adding 2')

     let expected_app_listing_2 = {};
     expected_app_listing_2[device_id] = {
        'public_key': app_pubkey_uncompressed_2,
        'root_urls': ['http://example.com/app2.root'],
        'datastore_urls': ['http://example.com/app2.datastore'],
        'fq_datastore_id': makeFullyQualifiedDataId(device_id, `${app_datastore_id_2}.datastore`),
     };

     t.ok(deepCompare(app_info_2, expected_app_listing_2), 'App listing 2 must match key file');
     t.ok(deepCompare(parsed_keyfile.profile, profile), 'profiles still match, after adding 2');
     t.end();
  });
}

function testKeyFileMisc() {

  const icann_names = ['foo.com', 'foo.com:8080', 'localhost:8888']
  const expected_app_names = ['foo.com.1', 'foo.com.1:8080', 'localhost.1:8888']

  test('keyFileICANNToAppName', (t) => {
    
     for (let i = 0; i < icann_names.length; i++) {
        const name = icann_names[i];
        const scheme_name = `http://${name}`;

        const expected_name = expected_app_names[i];

        t.ok(keyFileICANNToAppName(name) === expected_name, `scheme-less ICANN name to app name: ${name} === ${keyFileICANNToAppName(name)} === ${expected_name}`);
        t.ok(keyFileICANNToAppName(scheme_name) === expected_name, `schemed ICANN name to app name: ${scheme_name} === ${keyFileICANNToAppName(scheme_name)} === ${expected_name}`);
        t.ok(keyFileICANNToAppName(expected_name) === expected_name, 'conversion is idempotent');
     }

     t.end();
  });
}


export function runKeyfilesUnitTests() {
  testKeyFileMisc();
  testKeyFileCreate(null, null);

  testKeyFileCreate(sampleProfiles.naval, null);
  testKeyFileCreate(sampleProfiles.google, null);
  testKeyFileCreate(sampleProfiles.baloonDog, null);

  let naval_apps = {
     'version': '1.0',
     'apps': {
         'mydevice': {
            'foo.com.1': {
               'public_key': '04806ab413ff168f76915725e75fda571ff8069d41d6193fa580866400807f8f5bffdb72356523a0f0f274b241139434b8871788d6f0c3211989217e2095704c2d',
               'root_urls': ['http://www.naval.com/naval.root'],
               'datastore_urls': ['http://www.naval.com/naval.datastore'],
               'fq_datastore_id': makeFullyQualifiedDataId('naval_phone', '1Jw7yUHbwUDLBKcRk8kcajYf3CqT1vJqj1.datastore'),
            },
         },
     },
     'timestamp': 12345678,
  };

  testKeyFileCreate(sampleProfiles.naval, naval_apps, null);
}
