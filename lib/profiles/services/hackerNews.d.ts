import { Service } from './service';
declare class HackerNews extends Service {
    static getBaseUrls(): string[];
    static getProofUrl(proof: any): string;
    static normalizeUrl(proof: any): string;
    static getProofStatement(searchText: string): string;
}
export { HackerNews };
