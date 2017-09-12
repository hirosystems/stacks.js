/* @flow */
import { profileServices } from './services'

export function validateProofs(profile: { account: Array<any> }, 
                                identifier: string, 
                                useBitcoinAddress: boolean = false) {
  if (!profile) {
    throw new Error('Profile must not be null')
  }

  let accounts: Array<any> = []
  const proofsToValidate = []

  if (profile.hasOwnProperty('account')) {
    accounts = profile.account
  } else {
    return new Promise((resolve) => {
      resolve([])  
    })
  }

  accounts.forEach((account) => {
    // skip if proof service is not supported
    if (account.hasOwnProperty('service') &&
        !profileServices.hasOwnProperty(account.service)) {
      return
    }

    if (!(account.hasOwnProperty('proofType') &&
        account.proofType === 'http' &&
        account.hasOwnProperty('proofUrl'))) {
      return
    }

    const proof = {
      service: account.service,
      proof_url: account.proofUrl,
      identifier: account.identifier,
      valid: false
    }

    proofsToValidate.push(new Promise((resolve) => {
      resolve(profileServices[account.service]
        .validateProof(proof, identifier, useBitcoinAddress))
    }))
  })

  return Promise.all(proofsToValidate)
}
