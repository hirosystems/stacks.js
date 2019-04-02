export declare function getPersonFromLegacyFormat(profile: any): {
    ['@type']: string;
    account?: any[];
    name?: string;
    description?: string;
    address?: {
        ['@type']: string;
        addressLocality: string;
    };
    image?: any[];
    website?: {
        ['@type']: string;
        url: string;
    }[];
};
