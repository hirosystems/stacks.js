/**
  * Signs a profile token
  * @param {Object} profile - the JSON of the profile to be signed
  * @param {String} privateKey - the signing private key
  * @param {Object} subject - the entity that the information is about
  * @param {Object} issuer - the entity that is issuing the token
  * @param {String} signingAlgorithm - the signing algorithm to use
  * @param {Date} issuedAt - the time of issuance of the token
  * @param {Date} expiresAt - the time of expiration of the token
  * @returns {Object} - the signed profile token
  */
export declare function signProfileToken(profile: any, privateKey: string, subject?: any, issuer?: any, signingAlgorithm?: string, issuedAt?: Date, expiresAt?: Date): any;
/**
  * Wraps a token for a profile token file
  * @param {String} token - the token to be wrapped
  * @returns {Object} - including `token` and `decodedToken`
  */
export declare function wrapProfileToken(token: string): {
    token: string;
    decodedToken: any;
};
/**
  * Verifies a profile token
  * @param {String} token - the token to be verified
  * @param {String} publicKeyOrAddress - the public key or address of the
  *   keypair that is thought to have signed the token
  * @returns {Object} - the verified, decoded profile token
  * @throws {Error} - throws an error if token verification fails
  */
export declare function verifyProfileToken(token: string, publicKeyOrAddress: string): any;
/**
  * Extracts a profile from an encoded token and optionally verifies it,
  * if `publicKeyOrAddress` is provided.
  * @param {String} token - the token to be extracted
  * @param {String} publicKeyOrAddress - the public key or address of the
  *   keypair that is thought to have signed the token
  * @returns {Object} - the profile extracted from the encoded token
  * @throws {Error} - if the token isn't signed by the provided `publicKeyOrAddress`
  */
export declare function extractProfile(token: string, publicKeyOrAddress?: string | null): {};
