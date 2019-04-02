import { Service } from './service';
declare class Github extends Service {
    static getBaseUrls(): string[];
    static normalizeUrl(proof: any): string;
    static getProofUrl(proof: any): string;
}
export { Github };
