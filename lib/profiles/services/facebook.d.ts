import { Service } from './service';
declare class Facebook extends Service {
    static getProofUrl(proof: any): any;
    static normalizeUrl(proof: any): any;
    static getProofStatement(searchText: string): string;
}
export { Facebook };
