export const OP_NAME_CLASS = '[a-z0-9\\-_.+]{3,37}';
export const OP_NAME_PATTERN = `^(${OP_NAME_CLASS})$`;
export const OP_SUBDOMAIN_NAME_PATTERN = `^(${OP_NAME_CLASS})\\.(${OP_NAME_CLASS})$`;
export const OP_NAME_OR_SUBDOMAIN_FRAGMENT = `(${OP_NAME_PATTERN})|(${OP_SUBDOMAIN_NAME_PATTERN})`;
export const OP_NAME_OR_SUBDOMAIN_PATTERN = `^${OP_NAME_OR_SUBDOMAIN_FRAGMENT}$`;
export const OP_DNS_NAME_PATTERN = '([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])(\\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9]))*';
export const OP_APP_NAME_PATTERN = `^(^(${OP_DNS_NAME_PATTERN})\\.1(:[0-9]+){{0,1}}$)|(${OP_NAME_OR_SUBDOMAIN_FRAGMENT}\\.x$)$`;

export const OP_HEX_PATTERN = '^([0-9a-fA-F]+)$';
export const OP_PUBKEY_PATTERN = OP_HEX_PATTERN;
export const OP_URI_TARGET_PATTERN = '^([a-z0-9+]+)://([a-zA-Z0-9\\-_.~%#?&\\:/=]+)$';

// minimal profile schema
export const MINIMAL_PROFILE_SCHEMA = {
   type: 'object',
   properties: {
      '@type': {
         type: 'string',
      },
   },
};

// key delegation schema 
export const KEY_DELEGATION_SCHEMA = {
    type: 'object',
    properties: {
        version: {
            type: 'string',
            pattern: '^1\\.0$',
        },
        name: {
            type: 'string',
            pattern: OP_NAME_OR_SUBDOMAIN_PATTERN,
        },
        devices: {
            type: 'object',
            patternProperties: {
                '^.+$': {
                    type: 'object',
                    properties: {
                        app: {
                            type: 'string',
                            pattern: OP_PUBKEY_PATTERN,
                        },
                        enc: {
                            type: 'string',
                            pattern: OP_PUBKEY_PATTERN,
                        },
                        sign: {
                            type: 'string',
                            pattern: OP_PUBKEY_PATTERN,
                        },
                        index: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 2147483647, // 2**31 - 1
                        },
                    },
                    required: [
                        'app',
                        'enc',
                        'sign',
                        'index',
                    ],
                    additionalProperties: false,
                },
            },
        },
        timestamp: {
            type: 'integer',
            minimum: 0,
        },
    },
    required: [
        'version',
        'name',
        'devices',
        'timestamp'
    ],
    additionalProperties: false,
}


// App key bundle
export const APP_KEY_BUNDLE_SCHEMA = {
    type: 'object',
    properties: {
        version: {
            type: 'string',
            pattern: '^1\\.0$',
        },
        apps: {
            type: 'object',
            patternProperties: {
                OP_NAME_OR_SUBDOMAIN_PATTERN: {
                    type: 'object',
                    items: {
                        public_key: {
                            type: 'string',
                            pattern: OP_PUBKEY_PATTERN,
                        },
                        fq_datastore_id: {
                            type: 'string',
                        },
                        datastore_urls: {
                            type: 'array',
                            items: {
                                type: 'string',
                                pattern: OP_URI_TARGET_PATTERN,
                            },
                        },
                        root_urls: {
                            type: 'array',
                            items: {
                                type: 'string',
                                pattern: OP_URI_TARGET_PATTERN,
                            },
                        },
                    },
                    required: [
                        'public_key',
                        'datastore_urls',
                        'root_urls',
                    ],
                },
            },
        },
        timestamp: {
            type: 'integer',
            minimum: 0,
        },
    },
    required: [
        'version',
        'apps',
        'timestamp'
    ],
    additionalProperties: false,
}


// Blockstack key file
// resides as "keyfile" within a profile
export const BLOCKSTACK_KEY_FILE_SCHEMA = {
    type: 'object',
    properties: {
        version: {
            type: 'string',
            pattern: '^3\\.0$',
        },
        keys: {
            type: 'object',
            properties: {
                name: {
                    type: 'array',
                    items: {
                        type: 'string',
                        pattern: OP_PUBKEY_PATTERN,
                    },
                },
                delegation: {
                    type: 'string',
                },
                apps: {
                    type: 'object',
                    patternProperties: {
                        '^.+$': {
                            type: 'string',
                        },
                    },
                },
            },
            required: [
                'name',
                'delegation',
                'apps',
            ],
            additionalProperties: false,
        },
        timestamp: {
            type: 'integer',
            minimum: 0,
        },
    },
    required: [
        'version',
        'keys',
        'timestamp'
    ],
    additionalProperties: false,
}

