'use strict'

import { services } from './services/index'

export function profileToProofs(profile, username) {
  let proofs = []

  let accounts = []

  if(profile.hasOwnProperty("account"))
    accounts = profile.account
  else
    return proofs

  accounts.forEach(function(account) {
    // skip if proof service is not supported
    if(account.hasOwnProperty("service") && !services.hasOwnProperty(account.service))
      return

    if(account.hasOwnProperty("proofType") && account.proofType == "http") {
      let proof = {"service": account.service,
               "proof_url": account.proofUrl,
               "identifier": account.identifier,
               "valid": false}

      if(services[account.service].isValidProof(account.identifier, username, account.proofUrl))
        proof.valid = true

      proofs.push(proof)

    }
  })

  return proofs
}
