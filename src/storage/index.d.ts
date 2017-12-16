// from ./index
export declare function getFile(path: string, decrypt?: boolean): Promise<any>;
export declare function putFile(path: string, content: string|Buffer, encrypt?: boolean): Promise<any>;
export declare function deleteFile(path: string): Promise<any>; // throws Error


export declare type GaiaHubConfig = {
  address: string,
  url_prefix: string,
  token: string,
  server: string
}
export declare function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string): Promise<any>;
export declare function uploadToGaiaHub(filename: string, contents: any, hubConfig: GaiaHubConfig, contentType?: string): Promise<any>;
export declare const BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config';
