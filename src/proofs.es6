'use strict'

import { services } from './services/index'

const validationTimeout = 30000  // 30 seconds

export function validateProofs(profile, fqdn) {
  let promise = new Promise( (resolve, reject) => {

    let proofs = []

    let accounts = []



    if(profile.hasOwnProperty("account"))
      accounts = profile.account
    else
      resolve(proofs)

    let accountsToValidate = accounts.length

    let timeoutTimer = setTimeout(() => {
      console.error("Blockstack proof validation timed out.")
      resolve(proofs)
    }, validationTimeout)

    accounts.forEach(function(account) {
      // skip if proof service is not supported
      if(account.hasOwnProperty("service") && !services.hasOwnProperty(account.service)) {
        accountsToValidate--
        return
      }

      if(!(account.hasOwnProperty("proofType") && account.proofType == "http" &&
         account.hasOwnProperty("proofUrl"))) {
        accountsToValidate--
        return
      }

      let proof = {"service": account.service,
               "proof_url": account.proofUrl,
               "identifier": account.identifier,
               "valid": false}

      services[account.service].validateProof(proof, fqdn).then((proof) => {
        proofs.push(proof)

        if(proofs.length >= accountsToValidate) {
          clearTimeout(timeoutTimer)
          resolve(proofs)
        }

      })

    })
  })

  return promise
}
