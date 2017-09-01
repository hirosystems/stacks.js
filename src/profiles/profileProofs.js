import { profileServices } from './services'

const validationTimeout = 30000  // 30 seconds

export function validateProofs(profile, identifier, useBitcoinAddress = false) {
  if (!profile) {
    throw new Error('Profile must not be null')
  }

  const promise = new Promise((resolve) => {
    const proofs = []
    let accounts = []

    if (profile.hasOwnProperty('account')) {
      accounts = profile.account
    } else {
      resolve(proofs)
    }

    let accountsToValidate = accounts.length

    const timeoutTimer = setTimeout(() => {
      console.error('Blockstack proof validation timed out.')
      resolve(proofs)
    }, validationTimeout)

    accounts.forEach((account) => {
      // skip if proof service is not supported
      if (account.hasOwnProperty('service') &&
          !profileServices.hasOwnProperty(account.service)) {
        accountsToValidate--
        return
      }

      if (!(account.hasOwnProperty('proofType') &&
          account.proofType === 'http' &&
          account.hasOwnProperty('proofUrl'))) {
        accountsToValidate--
        return
      }

      const proof = {
        service: account.service,
        proof_url: account.proofUrl,
        identifier: account.identifier,
        valid: false
      }

      profileServices[account.service]
      .validateProof(proof, identifier, useBitcoinAddress)
      .then((validatedProof) => {
        proofs.push(validatedProof)
        if (proofs.length >= accountsToValidate) {
          clearTimeout(timeoutTimer)
          resolve(proofs)
        }
      })
    })
  })

  return promise
}
