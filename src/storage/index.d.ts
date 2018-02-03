// from ./index
export declare type GetFileOptions = {
  decrypt?: boolean,
  username?: string,
  app?: string,
  zoneFileLookupURL?: string
}
export declare type PutFileOptions = {
  encrypt?: boolean
}

export declare function getUserAppFileUrl(path: string, username: string, appOrigin: string, zoneFileLookupURL: string): Promise<string>;
export declare function getFile(path: string, options?: GetFileOptions): Promise<any>;
export declare function putFile(path: string, content: string|Buffer, options?: PutFileOptions): Promise<any>;
export declare function deleteFile(path: string): Promise<any>; // throws Error
export declare function getAppBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string>;


export declare type GaiaHubConfig = {
  address: string,
  url_prefix: string,
  token: string,
  server: string
}
export declare function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string): Promise<any>;
export declare function uploadToGaiaHub(filename: string, contents: any, hubConfig: GaiaHubConfig, contentType?: string): Promise<any>;
export declare function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string>;
export declare const BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config';
