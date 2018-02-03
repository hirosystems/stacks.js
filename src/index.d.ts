/// <reference types="node" />



export * from './auth/index';
export * from './profiles/index';
export * from './storage/index';


// from ./dids.js
export declare function makeDIDFromAddress(address: string): string;
export declare function makeDIDFromPublicKey(publicKey: string): string;
export declare function getDIDType(decentralizedID: string): string; // throws InvalidDIDError
export declare function getAddressFromDID(decentralizedID: string): string|null;


// from ./keys.js
export declare function getEntropy(numberOfBytes?: number): Buffer;
export declare function makeECPrivateKey(): string;
export declare function publicKeyToAddress(publicKey: string): string;
export declare function getPublicKeyFromPrivate(privateKey: string): string;


// from ./utils
export declare function nextMonth(): number;
export declare function nextHour(): number;
export declare function nextYear(): number;
export declare function makeUUID4(): string;
export declare const hasprop: any; // TODO: What's this?
export declare function updateQueryStringParameter(uri: string, key: string, value: string): string;
export declare function isLaterVersion(v1: string, v2: string): boolean;
export declare function isSameOriginAbsoluteUrl(uri1: string, uri2: string): boolean;


// from jsontokens
export declare interface JWToken {
  header: Object;
  payload: Object;
  signature: string;
}

export declare function decodeToken(token: string): JWToken; // throws InvalidTokenError
