/**
* @ignore
*/
declare function isNameValid(fullyQualifiedName?: string): Promise<boolean>;
/**
* @ignore
*/
declare function isNamespaceValid(namespaceID: string): Promise<boolean>;
/**
* @ignore
*/
declare function isNameAvailable(fullyQualifiedName: string): Promise<boolean>;
/**
* @ignore
*/
declare function isNamespaceAvailable(namespaceID: string): Promise<boolean>;
/**
* @ignore
*/
declare function ownsName(fullyQualifiedName: string, ownerAddress: string): Promise<boolean>;
/**
* @ignore
*/
declare function revealedNamespace(namespaceID: string, revealAddress: string): Promise<boolean>;
/**
* @ignore
*/
declare function namespaceIsReady(namespaceID: string): Promise<any>;
/**
* @ignore
*/
declare function namespaceIsRevealed(namespaceID: string): Promise<boolean>;
/**
* @ignore
*/
declare function isInGracePeriod(fullyQualifiedName: string): Promise<boolean>;
/**
* @ignore
*/
declare function addressCanReceiveName(address: string): Promise<boolean>;
/**
* @ignore
*/
declare function isAccountSpendable(address: string, tokenType: string, blockHeight: number): Promise<boolean>;
/**
* @ignore
*/
export declare const safety: {
    addressCanReceiveName: typeof addressCanReceiveName;
    isInGracePeriod: typeof isInGracePeriod;
    ownsName: typeof ownsName;
    isNameAvailable: typeof isNameAvailable;
    isNameValid: typeof isNameValid;
    isNamespaceValid: typeof isNamespaceValid;
    isNamespaceAvailable: typeof isNamespaceAvailable;
    revealedNamespace: typeof revealedNamespace;
    namespaceIsReady: typeof namespaceIsReady;
    namespaceIsRevealed: typeof namespaceIsRevealed;
    isAccountSpendable: typeof isAccountSpendable;
};
export {};
