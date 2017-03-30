'use strict'

export const MUTABLE_DATUM_FILE_TYPE = 1;
export const MUTABLE_DATUM_DIR_TYPE = 2;

export const OP_BASE58CHECK_PATTERN = "^([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)$";
export const OP_ADDRESS_PATTERN = OP_BASE58CHECK_PATTERN;
export const OP_UUID_PATTERN = "^([0-9a-fA-F\-]+)$";
export const OP_HEX_PATTERN = "^([0-9a-fA-F]+)$";
export const OP_URLENCODED_NOSLASH_PATTERN = "^([a-zA-Z0-9\-_.~%]+)$";
export const OP_URLENCODED_PATTERN = "^([a-zA-Z0-9\-_.~%/]+)$";
export const OP_URLENCODED_NOSLASH_OR_EMPTY_PATTERN = "^([a-zA-Z0-9\-_.~%]*)$";
export const OP_URLENCODED_OR_EMPTY_PATTERN = "^([a-zA-Z0-9\-_.~%/]*)$";
export const OP_PUBKEY_PATTERN = OP_HEX_PATTERN;
export const OP_BASE64_PATTERN = "(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})";

export const SUCCESS_FAIL_SCHEMA = {
   anyOf: [
      {
         type: 'object',
         properties: {
            status: {
               type: 'boolean'
            },
         },
      },
      {
         type: 'object',
         properties: {
            error: {
               type: 'string'
            },
         },
      },
   ],
};


export const MUTABLE_DATUM_SCHEMA_BASE_PROPERTIES = {
    type: {
        type: 'integer',
        minimum: MUTABLE_DATUM_FILE_TYPE,
        maximum: MUTABLE_DATUM_DIR_TYPE,
    },
    owner: {
        type: 'string',
        pattern: OP_ADDRESS_PATTERN,
    },
    uuid: {
        type: 'string',
        pattern: OP_UUID_PATTERN,
    },
    version: {
        type: 'integer',
    },
    proto_version: {
        type: 'integer',
    },
};

export const MUTABLE_DATUM_SCHEMA_HEADER_PROPERTIES = Object.assign({}, MUTABLE_DATUM_SCHEMA_BASE_PROPERTIES);
MUTABLE_DATUM_SCHEMA_HEADER_PROPERTIES['data_hash'] = {
        type: 'string',
        pattern: OP_HEX_PATTERN,
};

export const MUTABLE_DATUM_DIRENT_SCHEMA = {
    type: 'object',
    properties: {
        type: {
            type: 'integer',
            minimum: MUTABLE_DATUM_FILE_TYPE,
            maximum: MUTABLE_DATUM_DIR_TYPE,
        },
        uuid: {
            type: 'string',
            pattern: OP_UUID_PATTERN,
        },
        version: {
            type: 'integer',
        }
    },
    additionalProperties: false,
    required: [
       'type',
       'uuid',
       'version',
    ],
};

export const MUTABLE_DATUM_DIR_IDATA_SCHEMA = {
    type: 'object',
    patternProperties: {
        OP_URLENCODED_NOSLASH_PATTERN: MUTABLE_DATUM_DIRENT_SCHEMA,
    },
};

export const MUTABLE_DATUM_FILE_SCHEMA_PROPERTIES = Object.assign({}, MUTABLE_DATUM_SCHEMA_BASE_PROPERTIES);
MUTABLE_DATUM_FILE_SCHEMA_PROPERTIES['idata'] = {
    type: 'string',
    pattern: OP_BASE64_PATTERN, 
};

export const MUTABLE_DATUM_DIR_SCHEMA_PROPERTIES = Object.assign({}, MUTABLE_DATUM_SCHEMA_BASE_PROPERTIES);
MUTABLE_DATUM_DIR_SCHEMA_PROPERTIES['idata'] = Object.assign({}, MUTABLE_DATUM_DIR_IDATA_SCHEMA);

export const MUTABLE_DATUM_INODE_HEADER_SCHEMA = {
    type: 'object',
    properties: MUTABLE_DATUM_SCHEMA_HEADER_PROPERTIES,
    additionalProperties: false,
    required: Object.keys(MUTABLE_DATUM_SCHEMA_HEADER_PROPERTIES),
};

export const MUTABLE_DATUM_FILE_SCHEMA = {
    type: 'object',
    properties: MUTABLE_DATUM_FILE_SCHEMA_PROPERTIES,
    additionalProperties: false,
    required: Object.keys(MUTABLE_DATUM_FILE_SCHEMA_PROPERTIES),
};

export const MUTABLE_DATUM_DIR_SCHEMA = {
    type: 'object',
    properties: MUTABLE_DATUM_DIR_SCHEMA_PROPERTIES,
    additionalProperties: false,
    required: Object.keys(MUTABLE_DATUM_DIR_SCHEMA_PROPERTIES),
};

export const MUTABLE_DATUM_INODE_SCHEMA = {
   anyOf: [
      Object.assign({}, MUTABLE_DATUM_FILE_SCHEMA),
      Object.assign({}, MUTABLE_DATUM_DIR_SCHEMA),
      Object.assign({}, MUTABLE_DATUM_INODE_HEADER_SCHEMA),
   ]
};

export const MUTABLE_DATUM_PATH_INFO_SCHEMA = {
    type: 'object',
    patternProperties: {
       OP_URLENCODED_PATTERN: {
          uuid: {
              type: 'string',
              pattern: OP_UUID_PATTERN,
          },
          name: {
              type: 'string',
              pattern: OP_URLENCODED_NOSLASH_PATTERN,
          },
          parent: {
              type: 'string',
              pattern: OP_URLENCODED_PATTERN,
          },
          inode: {
             anyOf: [
                 MUTABLE_DATUM_DIR_SCHEMA,
                 MUTABLE_DATUM_FILE_SCHEMA,
                 MUTABLE_DATUM_INODE_HEADER_SCHEMA,
              ],
          },
       },
    },
    additionalProperties: false,
};

export const MUTABLE_DATUM_RESPONSE_SCHEMA = {
   type: 'object',
   properties: {
      status: {
         type: 'boolean',
      },
      file: MUTABLE_DATUM_FILE_SCHEMA,
      dir: MUTABLE_DATUM_DIR_SCHEMA,
      inode: MUTABLE_DATUM_INODE_SCHEMA,
   },
   additionalProperties: false,
   required: [
      'status'
   ],
};

export const MUTABLE_DATUM_EXTENDED_RESPONSE_SCHEMA = Object.assign({}, MUTABLE_DATUM_RESPONSE_SCHEMA);
MUTABLE_DATUM_EXTENDED_RESPONSE_SCHEMA['path_info'] = MUTABLE_DATUM_PATH_INFO_SCHEMA;

export const DATASTORE_SCHEMA = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            pattern: "([a-zA-Z0-9_]+)$",
        },
        pubkey: {
            type: 'string',
            pattern: OP_PUBKEY_PATTERN,
        },
        drivers: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        device_ids: {
            type: 'array',
            items: {
                'type': 'string',
            },
        },
        root_uuid: {
            type: 'string',
            pattern: OP_UUID_PATTERN,
        },
    },
    additionalProperties: false,
    required: [
       'type',
       'pubkey',
       'drivers',
       'device_ids',
       'root_uuid',
    ],
};


export const DATASTORE_RESPONSE_SCHEMA = {
   type: 'object',
   properties: {
      datastore: DATASTORE_SCHEMA,
   },
   additionalProperties: false,
   required: ['datastore'],
};

export const DATASTORE_LOOKUP_PATH_ENTRY_SCHEMA = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            pattern: OP_URLENCODED_NOSLASH_OR_EMPTY_PATTERN,
        },
        uuid: {
            type: 'string',
            pattern: OP_UUID_PATTERN,
        },
        parent: {
            type: 'string',
            pattern: OP_URLENCODED_OR_EMPTY_PATTERN,
        },
        inode: MUTABLE_DATUM_DIR_SCHEMA,
    },
    additionalProperties: false,
    required: [
       'name',
       'uuid',
       'parent',
       'inode',
    ],
};


export const DATASTORE_LOOKUP_INODE_SCHEMA = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            pattern: OP_URLENCODED_NOSLASH_OR_EMPTY_PATTERN,
        },
        uuid: {
            type: 'string',
            pattern: OP_UUID_PATTERN,
        },
        parent: {
            type: 'string',
            pattern: OP_URLENCODED_OR_EMPTY_PATTERN,
        },
        inode: {
            anyOf: [
                MUTABLE_DATUM_DIR_SCHEMA,
                MUTABLE_DATUM_FILE_SCHEMA,
                MUTABLE_DATUM_INODE_HEADER_SCHEMA,
            ],
        },
    },
    additionalProperties: false,
    required: [
       'name',
       'uuid',
       'parent',
       'inode',
    ],
};


export const DATASTORE_LOOKUP_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        inode: {
            anyOf: [
                MUTABLE_DATUM_DIR_SCHEMA,
                MUTABLE_DATUM_FILE_SCHEMA,
                MUTABLE_DATUM_INODE_HEADER_SCHEMA,
            ],
        },
        status: {
            type: 'boolean',
        },
    },
    additionalProperties: false,
    required: ['inode', 'status'],
};


export const DATASTORE_LOOKUP_EXTENDED_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        path_info: {
            type: 'object',
            patternProperties: {
                OP_URLENCODED_OR_EMPTY_PATTERN: DATASTORE_LOOKUP_INODE_SCHEMA,
            },
            additionalProperties: false,
        },
        inode_info: DATASTORE_LOOKUP_INODE_SCHEMA,
        status: {
            type: 'boolean',
        },
    },
    additionalProperties: false,
    required: [
       'path_info',
       'inode_info',
       'status',
    ],
};

export const CORE_ERROR_SCHEMA = {
   type: 'object',
   properties: {
      error: {
         type: 'string',
      },
      errno: {
         type: 'integer',
      },
   },
   additionalProperties: false,
   required: [
      'errno',
      'error',
   ],
};
