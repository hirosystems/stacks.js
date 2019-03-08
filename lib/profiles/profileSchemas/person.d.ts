import { Profile } from '../profile';
export declare class Person extends Profile {
    constructor(profile?: {});
    static validateSchema(profile: any, strict?: boolean): any;
    static fromToken(token: string, publicKeyOrAddress?: string | null): Person;
    static fromLegacyFormat(legacyProfile: any): Person;
    toJSON(): {
        profile: {
            [key: string]: any;
        };
        name: any;
        givenName: any;
        familyName: any;
        description: any;
        avatarUrl: string;
        verifiedAccounts: any[];
        address: any;
        birthDate: any;
        connections: any[];
        organizations: any;
    };
    profile(): {
        [key: string]: any;
    };
    name(): any;
    givenName(): any;
    familyName(): any;
    description(): any;
    avatarUrl(): string;
    verifiedAccounts(verifications?: any[]): any[];
    address(): any;
    birthDate(): any;
    connections(): any[];
    organizations(): any;
}
