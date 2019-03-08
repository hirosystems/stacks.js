/// <reference types="node" />
export declare function getEntropy(numberOfBytes: number): Buffer;
export declare function makeECPrivateKey(): string;
export declare function publicKeyToAddress(publicKey: string): string;
export declare function getPublicKeyFromPrivate(privateKey: string): string;
