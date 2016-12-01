'use strict'

import { services } from './services/index'

const validationTimeout = 30000  // 30 seconds

export function validateProofs(profile, username) {
  let promise = new Promise( (resolve, reject) => {

    let proofs = []

    let accounts = []

    if(profile.hasOwnProperty("account"))
      accounts = profile.account
    else
      resolve(proofs)

    accounts.forEach(function(account) {
      // skip if proof service is not supported
      if(account.hasOwnProperty("service") && !services.hasOwnProperty(account.service))
        return

      if(account.hasOwnProperty("proofType") && account.proofType == "http") {
        let proof = {"service": account.service,
                 "proof_url": account.proofUrl,
                 "identifier": account.identifier,
                 "valid": false}

        services[account.service].validateProof(proof).then((proof) => {
          proofs.push(proof)

          if(proofs.length >= accounts.length) {
            resolve(proofs)
          }

        })
      }
    })
  })

  return promise
}
