/* @flow */
import { getFile as storageGetFile,
  putFile as storagePutFile } from 'blockstack-storage'

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
