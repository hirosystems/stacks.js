import bitcoin from 'bitcoinjs-lib';
import BN from 'bn.js';
declare type AmountTypeV1 = number;
declare type AmountTypeV2 = {
    units: string;
    amount: BN;
};
declare type AmountType = AmountTypeV1 | AmountTypeV2;
/**
* @ignore
*/
export declare class BlockstackNamespace {
    namespaceID: string;
    version: number;
    lifetime: number;
    coeff: number;
    base: number;
    buckets: Array<number>;
    nonalphaDiscount: number;
    noVowelDiscount: number;
    constructor(namespaceID: string);
    check(): boolean;
    setVersion(version: number): void;
    setLifetime(lifetime: number): void;
    setCoeff(coeff: number): void;
    setBase(base: number): void;
    setBuckets(buckets: Array<number>): void;
    setNonalphaDiscount(nonalphaDiscount: number): void;
    setNoVowelDiscount(noVowelDiscount: number): void;
    toHexPayload(): string;
}
/**
* @ignore
*/
export declare function makePreorderSkeleton(fullyQualifiedName: string, consensusHash: string, preorderAddress: string, burnAddress: string, burn: AmountType, registerAddress?: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeRegisterSkeleton(fullyQualifiedName: string, ownerAddress: string, valueHash?: string, burnTokenAmountHex?: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeRenewalSkeleton(fullyQualifiedName: string, nextOwnerAddress: string, lastOwnerAddress: string, burnAddress: string, burn: AmountType, valueHash?: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeTransferSkeleton(fullyQualifiedName: string, consensusHash: string, newOwner: string, keepZonefile?: boolean): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeUpdateSkeleton(fullyQualifiedName: string, consensusHash: string, valueHash: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeRevokeSkeleton(fullyQualifiedName: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeNamespacePreorderSkeleton(namespaceID: string, consensusHash: string, preorderAddress: string, registerAddress: string, burn: AmountType): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeNamespaceRevealSkeleton(namespace: BlockstackNamespace, revealAddress: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeNamespaceReadySkeleton(namespaceID: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeNameImportSkeleton(name: string, recipientAddr: string, zonefileHash: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeAnnounceSkeleton(messageHash: string): bitcoin.Transaction;
/**
* @ignore
*/
export declare function makeTokenTransferSkeleton(recipientAddress: string, consensusHash: string, tokenType: string, tokenAmount: BN, scratchArea: string): bitcoin.Transaction;
export {};
