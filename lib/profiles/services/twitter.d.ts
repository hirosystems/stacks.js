import { Service } from './service';
declare class Twitter extends Service {
    static getBaseUrls(): string[];
    static normalizeUrl(proof: any): string;
    static getProofStatement(searchText: string): string;
}
export { Twitter };
