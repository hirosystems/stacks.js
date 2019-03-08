export declare class Profile {
    _profile: {
        [key: string]: any;
    };
    constructor(profile?: {});
    toJSON(): {
        [key: string]: any;
    };
    toToken(privateKey: string): any;
    static validateSchema(profile: any, strict?: boolean): any;
    static fromToken(token: string, publicKeyOrAddress?: string | null): Profile;
    static makeZoneFile(domainName: string, tokenFileURL: string): any;
    static validateProofs(domainName: string): Promise<any[]>;
}
