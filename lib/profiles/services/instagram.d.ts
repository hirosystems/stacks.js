import { Service } from './service';
declare class Instagram extends Service {
    static getBaseUrls(): string[];
    static getProofUrl(proof: any): any;
    static normalizeUrl(proof: any): any;
    static shouldValidateIdentityInBody(): boolean;
    static getProofIdentity(searchText: string): string;
    static getProofStatement(searchText: string): string;
}
export { Instagram };
