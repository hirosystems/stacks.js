/* @flow */
import { 
  getFile as storageGetFile,
  putFile as storagePutFile,
  datastoreMountOrCreate as storageDatastoreMountOrCreate
} from 'blockstack-storage'

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(path: string) {
  return storageGetFile(path)
}

/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer) {
  return storagePutFile(path, content)
}

/*
 * Creates and mounts a datastore
 * @param replicationStrategy {object} how do we replicate? TODO
 * @param sessionToken {String} the session token
 * @param appPrivateKey {String} the application-specific private key
 */
export function datastoreMountOrCreate(replicationStrategy: Object | null, sessionToken: string | null, appPrivateKey: string | null, apiPassword : string | null) {
  return storageDatastoreMountOrCreate(replicationStrategy, sessionToken, appPrivateKey, apiPassword)
}


/*
 * Make a fully-qualified data ID (i.e. includes the device ID)
 * equivalent to this in Python: urllib.quote(str('{}:{}'.format(device_id, data_id).replace('/', '\\x2f')))
 * 
 * @param device_id (String) the device ID 
 * @param data_id (String) the device-agnostic part of the data ID
 *
 * Returns the fully-qualified data ID
 */
export function makeFullyQualifiedDataId(device_id: string, data_id: string) {
   return escape(`${device_id}:${data_id}.gaia`.replace('/', '\\x2f'));
}

