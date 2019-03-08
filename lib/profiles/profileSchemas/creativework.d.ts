import { Profile } from '../profile';
export declare class CreativeWork extends Profile {
    constructor(profile?: {});
    static validateSchema(profile: any, strict?: boolean): any;
    static fromToken(token: string, publicKeyOrAddress?: string | null): CreativeWork;
}
