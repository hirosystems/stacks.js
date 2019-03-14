/**
 * Validates the social proofs in a user's profile. Currently supports validation of
 * Facebook, Twitter, GitHub, Instagram, LinkedIn and HackerNews accounts.
 *
 * @param {Object} profile The JSON of the profile to be validated
 * @param {string} ownerAddress The owner bitcoin address to be validated
 * @param {string} [name=null] The Blockstack name to be validated
 * @returns {Promise} that resolves to an array of validated proof objects
 */
export declare function validateProofs(profile: any, ownerAddress: string, name?: string): Promise<any[]>;
