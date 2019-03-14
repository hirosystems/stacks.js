import { Service } from './service';
declare class LinkedIn extends Service {
    static getBaseUrls(): string[];
    static getProofUrl(proof: any): any;
    static normalizeUrl(proof: any): string;
    static shouldValidateIdentityInBody(): boolean;
    static getProofIdentity(searchText: string): string;
    static getProofStatement(searchText: string): string;
}
export { LinkedIn };
