import { Service } from './service';
interface ValidateProofService {
    validateProof(proof: any, ownerAddress: string, name?: string): Promise<any>;
    getProofUrl(proof: any): string;
    getProofStatement(searchText: string): string;
    normalizeUrl(proof: any): string;
    getProofIdentity(searchText: string): string;
}
export declare const profileServices: {
    [serviceName: string]: Service & ValidateProofService;
};
export { containsValidProofStatement, containsValidAddressProofStatement } from './serviceUtils';
