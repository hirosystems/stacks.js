import { UserSession } from '../auth/userSession';
export declare const BLOCKSTACK_GAIA_HUB_LABEL = "blockstack-gaia-hub-config";
export declare type GaiaHubConfig = {
    address: string;
    url_prefix: string;
    token: string;
    server: string;
};
export declare function uploadToGaiaHub(filename: string, contents: any, hubConfig: GaiaHubConfig, contentType?: string): Promise<string>;
export declare function getFullReadUrl(filename: string, hubConfig: GaiaHubConfig): string;
export declare function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string, associationToken?: string): Promise<GaiaHubConfig>;
/**
 * These two functions are app-specific connections to gaia hub,
 *   they read the user data object for information on setting up
 *   a hub connection, and store the hub config to localstorage
 * @param {UserSession} caller - the instance calling this function
 * @private
 * @returns {Promise} that resolves to the new gaia hub connection
 */
export declare function setLocalGaiaHubConnection(caller: UserSession): Promise<GaiaHubConfig>;
export declare function getOrSetLocalGaiaHubConnection(caller: UserSession): Promise<GaiaHubConfig>;
export declare function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string>;
