/// <reference types="node" />
export declare function getEntropy(numberOfBytes: number): Buffer;
/**
* @ignore
*/
export declare function makeECPrivateKey(): string;
/**
* @ignore
*/
export declare function publicKeyToAddress(publicKey: string): string;
/**
* @ignore
*/
export declare function getPublicKeyFromPrivate(privateKey: string): string;
