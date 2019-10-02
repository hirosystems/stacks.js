/* eslint-disable import/no-unused-modules */

export interface Hash {
  digest(data: NodeJS.TypedArray): Promise<Buffer>;
}

export interface Hmac {
  digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer>;
}
