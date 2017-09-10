import {
  IdentityAddressOwnerNode,
} from '../wallet';

import {
   APP_KEY_BUNDLE_SCHEMA,
   KEY_DELEGATION_SCHEMA, 
   BLOCKSTACK_KEY_FILE_SCHEMA,
   MINIMAL_PROFILE_SCHEMA,
   OP_APP_NAME_PATTERN
} from './profileSchemas';

import {
   signProfileToken,
} from './profileTokens';

import {
   getPubkeyHex,
   publicKeyToAddress,
   compressPublicKey,
   decompressPublicKey,
} from '../keys';

import {
   makeFullyQualifiedDataId
} from '../storage';

const Ajv = require('ajv');
const jsontokens = require('jsontokens');
const assert = require('assert');
const bitcoinjs = require('bitcoinjs-lib');
const URL = require('url');

/*
 * Make a delegation entry's private keys.
 * @identityKeypair (object) This is the bundle of name-owner information
 * @key_index (int) this is the identity index
 *
 * Returns private keys object, keyed with 'app', 'enc', 'sign', and 'owner'
 */
export function keyFileMakeDelegationPrivateKeys(identityKeypair, key_index = 0) {
   assert(identityKeypair.nodeKey, `BUG: missing .nodeKey in identityKeypair ${key_index}`);

   const identity_owner_node = new IdentityAddressOwnerNode(bitcoinjs.HDNode.fromBase58(identityKeypair.nodeKey), identityKeypair.salt); 
   const signing_key_node = identity_owner_node.getSigningNode();
   const encryption_key_node = identity_owner_node.getEncryptionNode();
   const apps_key_node = identity_owner_node.getAppsNode();

   // tricky...
   const apps_privkey_hex = apps_key_node.getNode().keyPair.d.toHex();
   const owner_privkey_hex = identity_owner_node.getNode().keyPair.d.toHex();
   
   assert(apps_privkey_hex, 'Unable to derive app root private key');
   assert(owner_privkey_hex, 'Unable to derive owner root private key');
   
   const signing_privkey_hex = signing_key_node.keyPair.d.toHex();
   const encryption_privkey_hex = encryption_key_node.keyPair.d.toHex();
    
   assert(signing_privkey_hex, 'Unable to derive signing private key');
   assert(encryption_privkey_hex, 'Unable to derive encryption private key');

   const privkeys = {
      'app': apps_privkey_hex,
      'enc': encryption_privkey_hex,
      'sign': signing_privkey_hex,
      'owner': owner_privkey_hex,
   };

   return privkeys;
}

/*
 * Make a delegation entry.
 * @identityKeypair (object) This is a bundle of key information for the name owner
 * @key_index (int) this is the identity index
 *
 * Returns the delegation object
 */
export function keyFileMakeDelegationEntry(identityKeypair, key_index) {
   // derive keys
   const privkeys = keyFileMakeDelegationPrivateKeys(identityKeypair, key_index);
   const delg = {
      'app': getPubkeyHex(privkeys['app']),
      'enc': getPubkeyHex(privkeys['enc']),
      'sign': getPubkeyHex(privkeys['sign']),
      'index': key_index
   };

   return delg;
}


/*
 * Sign a keyfile
 * 
 * @key_file (object) the key file to sign
 * @signing_privkey (string) the signing key 
 *
 * Returns the serialized JWT
 */
export function keyFileSign(key_file, signing_privkey) {
    const signer = new jsontokens.TokenSigner('ES256k', signing_privkey);
    const jwt = signer.sign(key_file);
    return jwt;
}


/*
 * Serialize a profile that contains a keyfile 
 */
export function keyFileProfileSerialize(profile, signing_privkey) {
    assert(signing_privkey);
    const tokenized_data = signProfileToken(profile, signing_privkey);
    return tokenized_data;
}


/*
 * Create a key file, optionally from an existing profile or existing key file state.
 * 
 * @name (string) this is the blockchain ID
 * @identityKeypair (object) this is the identity keypair bundle
 * @opts (object) the set of optional keyword arguments:
 * * @key_order (array) this is the list of device IDs that determine the verification order of the keys derived from the master keychain
 * * @profile (object) this is the profile of the name, if it exists already
 * * @apps (object) this is the existing application bundle
 * * @index (object) index of this name in the identity keychain
 *
 * Returns the new profile with the keyfile
 */
export function keyFileCreate(name, identityKeypair, device_id, opts) {
   if (!opts) {
      opts = {};
   }

   let apps = opts.app || null;
   let profile = opts.profile || null;
   const key_index = opts.index || 0;

   const now = parseInt(new Date().getTime() / 1000, 10);

   if (!apps) {
      // default apps 
      apps = {};
      apps[device_id] = { 'version': '1.0', 'apps': {}, 'timestamp': now };
   }

   if (!profile) {
      // default (empty) profile 
      profile = { '@type': 'Person', 'accounts': [] };
   }

   if (Object.keys(profile).includes('keyfile')) {
      delete profile['keyfile'];
   }

   profile['timestamp'] = now;

   const delegations = {
      'version': '1.0',
      'name': name,
      'devices': {},
      'timestamp': now,
   };

   delegations['devices'][device_id] = keyFileMakeDelegationEntry(identityKeypair, key_index);

   const ajv = new Ajv();

   // sanity check: apps must be well-formed per-device app key bundles
   for (const dev_id of Object.keys(apps)) {
       const valid = ajv.validate(APP_KEY_BUNDLE_SCHEMA, apps[dev_id]);
       if (!valid) {
          throw new Error(`Invalid app bundle for device ${dev_id}`);
       }
   }

   // sanity check: delegation must be well-formed
   let valid = ajv.validate(KEY_DELEGATION_SCHEMA, delegations);
   if (!valid) {
      throw new Error('Invalid key delegation object');
   }

   // sanity check: profile must be valid 
   valid = ajv.validate(MINIMAL_PROFILE_SCHEMA, profile);
   if (!valid) {
      throw new Error('Invalid profile object');
   }

   // derive signing keys
   // TODO: flesh out for multisig
   const privkeys = keyFileMakeDelegationPrivateKeys(identityKeypair, key_index);
   const owner_privkeys = {};
   const signing_privkeys = {};

   owner_privkeys[device_id] = privkeys['owner'];
   signing_privkeys[device_id] = privkeys['sign'];

   // make delegation JWT
   const signer = new jsontokens.TokenSigner('ES256k', owner_privkeys[device_id]);
   const delegation_jwt_txt = signer.sign(delegations);

   // make apps jwt 
   const apps_jwt_txt = {};
   for (const dev_id of Object.keys(apps)) {
      const app_signer = new jsontokens.TokenSigner('ES256k', signing_privkeys[dev_id]);
      const app_jwt_txt = app_signer.sign(apps[dev_id]);

      apps_jwt_txt[dev_id] = app_jwt_txt;
   }

   // make list of name public keys 
   const name_pubkeys = [getPubkeyHex(privkeys['owner'])];
   
   // key file 
   const keyfile = {
      'version': '3.0',
      'keys': {
         'name': name_pubkeys,
         'delegation': delegation_jwt_txt,
         'apps': apps_jwt_txt,
       },
       'timestamp': now,
   };

   // sign it 
   const keyfile_txt = keyFileSign(keyfile, signing_privkeys[device_id]);
   
   // build profile 
   profile['keyfile'] = keyfile_txt;

   const profile_jwt_txt = keyFileProfileSerialize(profile, signing_privkeys[device_id]);
   return profile_jwt_txt;
}


/*
 * Given a JWT-ized profile, extract the profile object.
 * Do not verify it.
 *
 * @profile_txt (string) the profile data, either as a JWT, or as a JSON dict with a JWT in it.
 *
 * Returns the parsed profile on success
 * Throws on error
 */
export function keyFileParseProfile(profile_txt) {
   let unverified_profile = null;

   // possibly JSON
   try {
      unverified_profile = JSON.parse(profile_txt);
      if (Array.isArray(unverified_profile)) {
         unverified_profile = unverified_profile[0];
      }

      unverified_profile = unverified_profile['claim'];
      assert(unverified_profile);
   }
   catch (e) {
      // possibly JWT 
      try {
         unverified_profile = jsontokens.decodeToken(profile_txt)['payload']['claim'];
         assert(unverified_profile);
      }
      catch (e2) {
         console.log(JSON.stringify(e));
         console.log(JSON.stringify(e2));
         throw new Error('Profile is neither a JWT nor JSON');
      }
   }

   return unverified_profile;
}


/*
 * Parse a serialized keyfile-containing profile
 *
 * @profile_txt (string) the JWT encoding the profile with the keyfile
 * @name_address (string) the base58check-encoded address that owns the name
 *
 * On success, returns an object with
 * .profile (object) the parsed profile
 * .keys (object) a bundle of keyfile data used by other keyfile methods
 */
export function keyFileParse(profile_txt, name_address) {
   let unverified_key_file = null;
   let unverified_profile = null;

   const signing_public_keys = {};
   const apps = {};
   const apps_jwts_txt = {};
   const datastore_index = {};

   let key_file = null;
   let delegation_jwt_txt = null;
   let delegation_jwt = null;
   let delegation_file = null;
   let profile = null;
   let key_txt = null;

   let name_owner_pubkeys = [];

   // extract the profile
   unverified_profile = keyFileParseProfile(profile_txt);

   // must be a minimal profile 
   const ajv = new Ajv();
   let valid = ajv.validate(MINIMAL_PROFILE_SCHEMA, unverified_profile);
   assert(valid, 'Invalid profile: does not conform to minimal profile schema');

   // must have a keyfile
   assert(unverified_profile['keyfile'], `Legacy profile: no key file entry in ${unverified_profile}`);

   key_txt = unverified_profile['keyfile'];
   unverified_key_file = jsontokens.decodeToken(key_txt)['payload'];
   assert(unverified_key_file, 'Invalid key file: Failed to decode');

   // must be well-formed 
   valid = ajv.validate(BLOCKSTACK_KEY_FILE_SCHEMA, unverified_key_file);
   assert(valid, 'Invalid key file: does not match key file schema');

   // extract delegation 
   delegation_jwt_txt = unverified_key_file['keys']['delegation'];
   assert(delegation_jwt_txt, 'Invalid key file: missing key delegation object');
   try {
      delegation_jwt = JSON.parse(delegation_jwt_txt);
   }
   catch (e) {
      delegation_jwt = delegation_jwt_txt;
   }
   assert(delegation_jwt, 'Invalid key file: invalid delegation object');

   // extract public keys
   name_owner_pubkeys = unverified_key_file['keys']['name'];
   assert(name_owner_pubkeys, 'Invalid key file: invalid name owner public keys');
   assert(Array.isArray(name_owner_pubkeys), 'Invalid key file: expected list of public keys');

   // TODO: only single-sig for now 
   assert(name_owner_pubkeys.length === 1, 'Multisig is not supported yet');

   // make sure they match the address.
   // try both compressed and uncompressed.
   // TODO: multisig support 
   assert(publicKeyToAddress(compressPublicKey(name_owner_pubkeys[0])) === name_address || 
          publicKeyToAddress(decompressPublicKey(name_owner_pubkeys[0])) === name_address,
          `Invalid key file: name public key ${name_owner_pubkeys[0]} does not match address ${name_address}`);

   // authenticate the delegation file 
   // TODO: multisig
   const delegation_verifier = new jsontokens.TokenVerifier('ES256k', name_owner_pubkeys[0]);
   assert(delegation_verifier.verify(delegation_jwt), 'Invalid key file: fialed to verify delegation signature');

   // decode delegation file
   delegation_file = jsontokens.decodeToken(delegation_jwt)['payload'];
   assert(delegation_file, 'Invalid key file: failed to decode delegation file JWT');

   // extract signing public keys 
   for (const dev_id of Object.keys(delegation_file['devices'])) {
      signing_public_keys[dev_id] = delegation_file['devices'][dev_id]['sign'];
   }

   // verify key file and profile, using any of the signing keys 
   for (const dev_id of Object.keys(signing_public_keys)) {
      const signing_public_key = signing_public_keys[dev_id];
      try {
         const profile_verifier = new jsontokens.TokenVerifier('ES256k', signing_public_key);
         assert(profile_verifier.verify(profile_txt));

         // success!
         profile = unverified_profile;
      }
      catch (e) {
         ;
      }

      try {
         const keyfile_verifier = new jsontokens.TokenVerifier('ES256k', signing_public_key);
         assert(keyfile_verifier.verify(key_txt));

         // success 
         key_file = unverified_key_file;
      }
      catch (e) {
         ;
      }

      if (key_file && profile) {
         break;
      }
   }

   assert(profile, `Invalid key file: Failed to verify profile with available signing keys (${profile_txt})`);
   assert(key_file, `Invalid key file: Failed to verify key file with available signing keys (${key_txt})`);

   // device IDs in the delegation file must include all of the device IDs in the app key bundles 
   for (const dev_id of Object.keys(key_file['keys']['apps'])) {
      assert(Object.keys(delegation_file['devices']).includes(dev_id), `Invalid key file: application key bundle contains a non-delegated device ID "${dev_id}"`);
   }

   // verify app key bundles, using each device's respective public key
   for (const dev_id of Object.keys(signing_public_keys)) {
      const signing_public_key = signing_public_keys[dev_id];
      if (!Object.keys(key_file['keys']['apps']).includes(dev_id)) {
         continue;
      }
    
      const apps_jwt_txt = key_file['keys']['apps'][dev_id];
      const apps_verifier = new jsontokens.TokenVerifier('ES256k', signing_public_key);
      assert(apps_verifier.verify(apps_jwt_txt), `Invalid key file: application key bundle for ${dev_id} has an invalid signature`);

      // valid, but well-formed?
      const app_payload = jsontokens.decodeToken(apps_jwt_txt)['payload'];
      assert(app_payload, `Invalid key file: missing apps payload for ${dev_id}`);
      assert(ajv.validate(APP_KEY_BUNDLE_SCHEMA, app_payload), `Invalid key file: apps payload for ${dev_id} is malformed`);

      // yup!
      apps[dev_id] = app_payload;
      apps_jwts_txt[dev_id] = apps_jwt_txt;
   }

   // map datastore ID to names 
   for (const dev_id of Object.keys(apps)) {
      const dev_apps = apps[dev_id]['apps'];
      for (const app_name of Object.keys(dev_apps)) {
         const datastore_id = publicKeyToAddress(dev_apps[app_name]['public_key']);
         datastore_index[datastore_id] = app_name;
      }
   }

   // success! 
   const key_file_data = {
      'profile': profile,
      'keys': {
         'name': key_file['keys']['name'],
         'delegation': delegation_file,
         'apps': apps,
      },
      'timestamp': key_file['timestamp'],
      'jwts': {
         'version': key_file['version'],
         'keys': {
            'name': key_file['keys']['name'],
            'delegation': delegation_jwt_txt,
            'apps': apps_jwts_txt,
         },
         'keyfile': key_txt,
         'timestamp': key_file['timestamp'],
      },
      'datastore_index': datastore_index,
   };

   return key_file_data
}


/*
 * Update the profile section of a key file
 *
 * @parsed_key_file (object) the return value of keyFileParse(),
 * @new_profile (object) the new profile data
 * @signing_private_key (object) the signing private key for this profile's name
 *
 * On success, returns the serialized profile with key file data
 * Throws on error
 */
export function keyFileUpdateProfile(parsed_key_file, new_profile, signing_private_key) {
   const jwts = parsed_key_file['jwts'];
   assert(jwts, 'Invalid key file: no jwts');

   const key_jwts = jwts['keys'];
   assert(key_jwts, 'Invalid key file: no key jwts');

   const key_txt = jwts['keyfile'];
   assert(key_txt, 'Invalid key file: no keyfile jwt');

   new_profile['timestamp'] = parseInt(new Date().getTime() / 1000, 10);
   new_profile['keyfile'] = key_txt;

   const profile_jwt_txt = keyFileProfileSerialize(new_profile, signing_private_key);
   return profile_jwt_txt;
}


/*
 * Convert a host:port or a scheme://host:port to an ICANN name in Blockstack
 */
export function keyFileICANNToAppName(icann_name) {
   if (!icann_name.startsWith('http')) {
      icann_name = `http://${icann_name}`;
   }

   const url_info = URL.parse(icann_name);

   // is this already valid?
   const name_regex = new RegExp(OP_APP_NAME_PATTERN);
   if (name_regex.test(url_info.host)) {
      return url_info.host;
   }

   const hostname = url_info.hostname;
   if (url_info.port) {
      return `${hostname}.1:${url_info.port}`;
   }
   else {
      return `${hostname}.1`;
   }
}


/*
 * Update the device-specific application set in a keyfile.
 *
 * @parsed_key_file (object) the return value of keyFileParse()
 * @device_id (string) the device ID whose apps will be upadted
 * @app_name (string) the fully-qualified application name 
 * @app_pubkey (string) the app-specific, device-specific public key to verify this app's data
 * @this_device_id (string) this client's device ID
 * @datastore_id (string) the datastore ID 
 * @datastore_urls (array) the list of URLs to the datastore record (may be empty)
 * @root_urls (array) the list of URLs to the root record (may be empty)
 * @signing_private_key (string) one of this name's signing private keys
 *
 * On success, returns the serialized profile with key file data
 * Throws on error
 */
export function keyFileUpdateApps(parsed_key_file, device_id, app_name, app_pubkey, this_device_id, datastore_id, datastore_urls, root_urls, signing_private_key) {
   const jwts = parsed_key_file['jwts'];
   assert(jwts, 'Invalid key file: no jwts');

   const key_jwts = jwts['keys'];
   assert(key_jwts, 'Invalid key file: no key jwts');

   const profile = parsed_key_file['profile'];
   assert(profile, 'Invalid key file: no profile');

   const delegation_jwt = key_jwts['delegation'];
   assert(delegation_jwt, 'Invalid key file: no delegations JWT');

   const apps_jwts = key_jwts['apps'];
   assert(apps_jwts, 'Invalid key file: no apps JWTs');

   const name_regex = new RegExp(OP_APP_NAME_PATTERN);
   assert(name_regex.test(app_name), `Invalid app name ${app_name}`);

   assert(Object.keys(parsed_key_file['keys']['delegation']['devices']).includes(device_id), `Device ${device_id} not present in delegation file`);

   const cur_apps = parsed_key_file['keys']['apps'];
   if (!Object.keys(cur_apps).includes(device_id)) {
      cur_apps[device_id] = { 'version': '1.0', 'apps': {} };
   }
   
   const fq_datastore_id = makeFullyQualifiedDataId(this_device_id, `${datastore_id}.datastore`);

   cur_apps[device_id]['apps'][app_name] = {
      'public_key': decompressPublicKey(app_pubkey),
      'fq_datastore_id': fq_datastore_id,
      'datastore_urls': datastore_urls,
      'root_urls': root_urls,
   };

   const now = parseInt(new Date().getTime() / 1000, 10);
   cur_apps[device_id]['timestamp'] = now;

   const app_signer = new jsontokens.TokenSigner('ES256k', signing_private_key);
   const apps_jwt = app_signer.sign(cur_apps[device_id]);
   
   apps_jwts[device_id] = apps_jwt;

   const new_timestamp = (now < parsed_key_file['timestamp'] + 1 ? parsed_key_file['timestamp'] + 1 : now);
   const keyfile = {
       'version': '3.0',
       'keys': {
          'name': parsed_key_file['keys']['name'],
          'delegation': delegation_jwt,
          'apps': apps_jwts,
       },
       'timestamp': new_timestamp,
   };

   const keyfile_txt = keyFileSign(keyfile, signing_private_key);
   profile['timestamp'] = now;
   profile['keyfile'] = keyfile_txt;

   const profile_jwt_txt = keyFileProfileSerialize(profile, signing_private_key);
   return profile_jwt_txt;
}


/*
 * Update a keyfile's device delegation object.  re-signs the apps and profile data as well.
 *
 * @parsed_key_file (object) data returned by keyFileParse()
 * @device_delegation (object) the new delegation entry
 * @name_owner_privkeys (array) the list of private keys represented in the delegation
 * @signing_private_key (string) the signing key to use to sign the profile (i.e. this device's signing key)
 *
 * On success, returns the serialized key file
 * Throws on error
 */
export function keyFileUpdateDelegation(parsed_key_file, device_delegation, name_owner_privkeys, signing_private_key) {
   const jwts = parsed_key_file['jwts'];
   assert(jwts, 'Invalid key file: missing jwts');

   const key_jwts = jwts['keys'];
   assert(key_jwts, 'Invalid key file: missing key jwts');

   const profile = parsed_key_file['profile'];
   assert(profile, 'Invalid key file: missing profile');

   const apps_jwt = key_jwts['apps'];
   assert(apps_jwt, 'Invalid key file: missing apps JWT');

   const app_infos = {};
   for (const dev_id of Object.keys(apps_jwt)) {
      app_infos[dev_id] = {};
      
      const dev_app_info = jsontokens.decodeToken(apps_jwt[dev_id]).payload;
      assert(dev_app_info, `Malformed app bundle for device ${dev_id}`);

      for (const app_name of Object.keys(dev_app_info)) {
         app_infos[dev_id][app_name] = dev_app_info[app_name];
      }
   }

   // TODO: multisig support
   assert(name_owner_privkeys.length === 1, 'Multisig is not supported yet');

   const ajv = new Ajv();
   assert(ajv.validate(KEY_DELEGATION_SCHEMA['properties']['devices'], device_delegation), 'Invalid device delegation');
   
   const new_delegation = Object.assign({}, parsed_key_file['keys']['delegation']);
   Object.assign(new_delegation['devices'], device_delegation);

   const now =  parseInt(new Date().getTime() / 1000, 10);
   new_delegation['timestamp'] = now;

   // TODO: multisig
   const signer = new jsontokens.TokenSigner('ES256k', name_owner_privkeys[0]);
   const new_delegation_jwt = signer.sign(new_delegation);
   const new_timestamp = (now < parsed_key_file['timestamp'] + 1 ? parsed_key_file['timestamp'] : now);
   
   // TODO: multisig
   const new_name_pubkeys = [];
   for (const privk of name_owner_privkeys) {
      new_name_pubkeys.push(getPubkeyHex(privk));
   }

   // re-generate all application JWTs 
   const new_apps_jwts = {};
   for (const dev_id of Object.keys(app_infos)) {
      const app_signer = new jsontokens.TokenSigner('ES256k', signing_private_key);
      const app_jwt = app_signer.sign(app_infos[dev_id]);
      new_apps_jwts[dev_id] = app_jwt;
   }

   const keyfile = {
      'version': '3.0',
      'keys': {
         'name': new_name_pubkeys,
         'delegation': new_delegation_jwt,
         'apps': new_apps_jwts,
      },
      'timestamp': new_timestamp,
   };

   const keyfile_txt = keyFileSign(keyfile, signing_private_key);
   
   profile['timestamp'] = now;
   profile['keyfile'] = keyfile_txt;

   const profile_jwt_txt = keyFileProfileSerialize(profile, signing_private_key);
   return profile_jwt_txt;
}


/*
 * Get the delegated device IDs from a keyfile
 * Returns the list of device IDs
 */
function keyFileGetDelegatedDeviceIDs(parsed_key_file) {
   const keys = parsed_key_file['keys'];
   assert(keys, 'Key file does not have a "keys" entry');
   
   const delegation = keys['delegation'];
   assert(delegation, 'Key file does not have a "keys.delegation" entry');

   return Object.keys(delegation['devices']);
}


/*
 * Get a keyfile's delegated device public keys
 * Returns an object mapping device IDs to public key bundles
 */
export function keyFileGetDelegatedDevicePubkeys(parsed_key_file) {
   const all_device_ids = keyFileGetDelegatedDeviceIDs(parsed_key_file);
   const all_pubkeys = {};

   const keys = parsed_key_file['keys'];
   assert(keys, 'key file is missing its keys');

   const delegation = keys['delegation'];
   assert(delegation, 'key file is missing its delegation');

   const device_info = delegation['devices'];
   assert(device_info, 'key file is missing devices');

   for (const dev_id of all_device_ids) {
      const info = {
         'version': delegation['version'],
         'app': device_info[dev_id]['app'],
         'enc': device_info[dev_id]['enc'],
         'sign': device_info[dev_id]['sign'],
      };

      all_pubkeys[dev_id] = info;
   }

   return all_pubkeys;
}


/*
 * Get a key file's signing public keys 
 * Returns an object mapping device IDs to public keys
 */
export function keyFileGetSigningPublicKeys(parsed_key_file) {
   const delegate_info = keyFileGetDelegatedDevicePubkeys(parsed_key_file);
   const signing_keys = {};
   for (const dev_id of Object.keys(delegate_info)) {
      signing_keys[dev_id] = delegate_info[dev_id]['sign'];
   }

   return signing_keys;
}


/*
 * Get a key file's application listing for a specific application
 * Returns an object mapping device IDs the application's public keys and datastore information.
 */
export function keyFileGetAppListing(parsed_key_file, full_application_name) {
   // find devices that can use this app
   const keys = parsed_key_file['keys'];
   assert(keys, 'key file is missing its keys');

   const apps = keys['apps'];
   assert(apps, 'key file is missing its apps');

   const all_device_ids = Object.keys(apps);
   const app_info = {};

   for (const dev_id of all_device_ids) {
      const dev_app_pubkey_info = apps[dev_id];
      if (!dev_app_pubkey_info) {
         continue;
      }

      const dev_app_info = dev_app_pubkey_info['apps'];
      assert(dev_app_info, `Invalid keyfile: no device-specific info for device ${dev_id}`);

      if (!Object.keys(dev_app_info).includes(full_application_name)) {
         continue;
      }

      app_info[dev_id] = {};
      Object.assign(app_info[dev_id], dev_app_info[full_application_name]);
   }

   return app_info;
}

