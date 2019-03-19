/// <reference types="node" />
import { connectToGaiaHub, uploadToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL } from './hub';
import { UserSession } from '../auth/userSession';
export declare type PutFileOptions = {
    encrypt?: boolean | string;
    sign?: boolean;
    contentType?: string;
};
/**
 * Deletes the specified file from the app's data store. Currently not implemented.
 * @param {String} path - the path to the file to delete
 * @returns {Promise} that resolves when the file has been removed
 * or rejects with an error
 */
export declare function deleteFile(path: string): void;
/**
 * Fetch the public read URL of a user file for the specified app.
 * @param {String} path - the path to the file to read
 * @param {String} username - The Blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {String} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @return {Promise<string>} that resolves to the public read URL of the file
 * or rejects with an error
 */
export declare function getUserAppFileUrl(path: string, username: string, appOrigin: string, zoneFileLookupURL?: string): Promise<string | null>;
/**
 * Encrypts the data provided with the app public key.
 * @param {String|Buffer} content - data to encrypt
 * @param {Object} [options=null] - options object
 * @param {String} options.publicKey - the hex string of the ECDSA public
 * key to use for encryption. If not provided, will use user's appPublicKey.
 * @return {String} Stringified ciphertext object
 */
export declare function encryptContent(content: string | Buffer, options?: {
    publicKey?: string;
}, caller?: UserSession): string;
/**
 * Decrypts data encrypted with `encryptContent` with the
 * transit private key.
 * @param {String|Buffer} content - encrypted content.
 * @param {Object} [options=null] - options object
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key to use for decryption. If not provided, will use user's appPrivateKey.
 * @return {String|Buffer} decrypted content.
 */
export declare function decryptContent(content: string, options?: {
    privateKey?: string;
}, caller?: UserSession): string | Buffer;
/**
 * Get the URL for reading a file from an app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 * @param {String} [options.zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @returns {Promise<string>} that resolves to the URL or rejects with an error
 */
export declare function getFileUrl(path: string, options?: {
    app?: string;
    username?: string;
    zoneFileLookupURL?: string;
}, caller?: UserSession): Promise<string>;
export declare type GetFileOptions = {
    decrypt?: boolean;
    verify?: boolean;
    username?: string | null;
    app?: string | null;
    zoneFileLookupURL?: string | null;
};
/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.decrypt=true] - try to decrypt the data with the app private key
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {Boolean} options.verify - Whether the content should be verified, only to be used
 * when `putFile` was set to `sign = true`
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 * @param {String} [options.zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export declare function getFile(path: string, options?: {
    decrypt?: boolean;
    verify?: boolean;
    username?: string;
    app?: string;
    zoneFileLookupURL?: string;
}, caller?: UserSession): Promise<string | ArrayBuffer>;
/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Object} [options=null] - options object
 * @param {Boolean|String} [options.encrypt=true] - encrypt the data with the app public key
 *                                                  or the provided public key
 * @param {Boolean} [options.sign=false] - sign the data using ECDSA on SHA256 hashes with
 *                                         the app private key
 * @param {String} [options.contentType=''] - set a Content-Type header for unencrypted data
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export declare function putFile(path: string, content: string | Buffer, options?: PutFileOptions, caller?: UserSession): Promise<string>;
/**
 * Get the app storage bucket URL
 * @param {String} gaiaHubUrl - the gaia hub URL
 * @param {String} appPrivateKey - the app private key used to generate the app address
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
export declare function getAppBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string>;
/**
 * List the set of files in this application's Gaia storage bucket.
 * @param {UserSession} caller - instance calling this method
 * @param {function} callback - a callback to invoke on each named file that
 * returns `true` to continue the listing operation or `false` to end it
 * @return {Promise} that resolves to the number of files listed
 */
export declare function listFiles(callback: (name: string) => boolean, caller?: UserSession): Promise<number>;
export { connectToGaiaHub, uploadToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL };
