import { profileServices } from './services'
import { CheerioModuleType } from './services/service'

export interface AccountProofInfo {
  service: string;
  identifier: string;
  proof_url: string;
  valid?: boolean;
}

/**
 * Validates the social proofs in a user's profile. Currently supports validation of 
 * Facebook, Twitter, GitHub, Instagram, LinkedIn and HackerNews accounts.
 *
 * @param {Object} profile The JSON of the profile to be validated
 * @param {string} ownerAddress The owner bitcoin address to be validated
 * @param {string} [name=null] The Blockstack name to be validated 
 * @returns {Promise} that resolves to an array of validated proof objects
 */
export function validateProofs(profile: any,
                               ownerAddress: string,
                               cheerio: CheerioModuleType,
                               name: string = null): Promise<AccountProofInfo[]> {
  if (!profile) {
    throw new Error('Profile must not be null')
  }

  let accounts: any[] = []
  const proofsToValidate: Promise<AccountProofInfo>[] = []

  if (profile.hasOwnProperty('account')) {
    accounts = profile.account
  } else {
    return Promise.resolve([])
  }

  accounts.forEach((account) => {
    // skip if proof service is not supported
    if (account.hasOwnProperty('service')
        && !profileServices.hasOwnProperty(account.service)) {
      return
    }

    if (!(account.hasOwnProperty('proofType')
        && account.proofType === 'http'
        && account.hasOwnProperty('proofUrl'))) {
      return
    }

    const proof: AccountProofInfo = {
      service: account.service,
      proof_url: account.proof_url || account.proofUrl,
      identifier: account.identifier,
      valid: false
    }

    proofsToValidate.push(profileServices[account.service]
      .validateProof(proof, ownerAddress, cheerio, name))
  })

  return Promise.all(proofsToValidate)
}
