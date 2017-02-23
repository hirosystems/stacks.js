'use strict'

import "isomorphic-fetch"
import { containsValidProofStatement } from "./serviceUtils"

export class Service {

  static validateProof(proof, fqdn) {
    return new Promise((resolve, reject) => {
      try {
        let proofUrl = this.getProofUrl(proof)
        fetch(proofUrl).then((res) => {
          if(res.status == 200) {
            res.text().then((text) => {
                proof.valid = containsValidProofStatement(text, fqdn)
                resolve(proof)
            })

          } else {
            console.error(`Proof url ${proofUrl} returned unexpected http status ${res.status}.
              Unable to validate proof.` )
            proof.valid = false
            resolve(proof)
          }
        }).catch((err) => {
          console.error(err)
          proof.valid = false
          resolve(proof)
        })
      } catch(e) {
        console.error(e)
        proof.valid = false
        resolve(proof)
      }
    })
  }

  static getBaseUrls() {
    return []
  }

  static getProofUrl(proof) {
    let baseUrls = this.getBaseUrls()
    for(let i = 0; i < baseUrls.length; i++) {
      if(proof.proof_url.startsWith(baseUrls[i]))
        return proof.proof_url
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

}
