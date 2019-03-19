export declare const BLOCKSTACK_GAIA_HUB_LABEL = "blockstack-gaia-hub-config";
export declare type GaiaHubConfig = {
    address: string;
    url_prefix: string;
    token: string;
    server: string;
};
export declare function uploadToGaiaHub(filename: string, contents: any, hubConfig: GaiaHubConfig, contentType?: string): Promise<string>;
export declare function getFullReadUrl(filename: string, hubConfig: GaiaHubConfig): Promise<string>;
export declare function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string, associationToken?: string): Promise<GaiaHubConfig>;
export declare function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string>;
