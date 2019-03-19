import { GaiaHubConfig } from '../storage/hub';
import { UserData } from './authApp';
export declare type SessionOptions = {
    appPrivateKey?: string;
    username?: string;
    identityAddress?: string;
    coreNode?: string;
    hubUrl?: string;
    userData?: UserData;
    transitKey?: string;
    localStorageKey?: string;
    storeOptions?: {
        localStorageKey?: string;
    };
};
export declare class SessionData {
    version: string;
    appPrivateKey?: string;
    identityAddress?: string;
    username?: string;
    coreNode?: string;
    hubUrl?: string;
    transitKey?: string;
    userData?: UserData;
    constructor(options: SessionOptions);
    getGaiaHubConfig(): GaiaHubConfig;
    setGaiaHubConfig(config: GaiaHubConfig): void;
    static fromJSON(json: any): SessionData;
    toString(): string;
}
