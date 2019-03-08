import 'cross-fetch/polyfill';
export declare class Service {
    static validateProof(proof: any, ownerAddress: string, name?: string): Promise<any>;
    static getBaseUrls(): string[];
    static getProofIdentity(searchText: string): string;
    static getProofStatement(searchText: string): string;
    static shouldValidateIdentityInBody(): boolean;
    static prefixScheme(proofUrl: string): string;
    static getProofUrl(proof: any): string;
}
