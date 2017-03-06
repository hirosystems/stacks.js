'use strict'

import { profileServices } from './services'

const validationTimeout = 30000  // 30 seconds

export function validateProofs(profile, fqdn) {
  if (!profile) {
    throw new Error("Profile must not be null")
  }

  let promise = new Promise((resolve, reject) => {

    let proofs = []
    let accounts = []

    if (profile.hasOwnProperty("account")) {
      accounts = profile.account
    } else {
      resolve(proofs)
    }

    let accountsToValidate = accounts.length

    let timeoutTimer = setTimeout(() => {
      console.error("Blockstack proof validation timed out.")
      resolve(proofs)
    }, validationTimeout)

    accounts.forEach(function(account) {
      // skip if proof service is not supported
      if (account.hasOwnProperty("service") &&
          !profileServices.hasOwnProperty(account.service)) {
        accountsToValidate--
        return
      }

      if (!(account.hasOwnProperty("proofType") &&
          account.proofType == "http" &&
          account.hasOwnProperty("proofUrl"))) {
        accountsToValidate--
        return
      }

      let proof = {
        "service": account.service,
        "proof_url": account.proofUrl,
        "identifier": account.identifier,
        "valid": false
      }

      profileServices[account.service].validateProof(proof, fqdn).then((proof) => {
        proofs.push(proof)
        if (proofs.length >= accountsToValidate) {
          clearTimeout(timeoutTimer)
          resolve(proofs)
        }
      })

    })
  })

  return promise
}