/* @flow */
import 'isomorphic-fetch'
import { containsValidProofStatement, containsValidBitcoinProofStatement } from './serviceUtils'

export class Service {
  static validateProof(proof: { 
                          proof_url: string, 
                          valid: boolean, 
                          service: string, 
                          identifier: string 
                        }, 
                        identifier: string, 
                        useBitcoinAddress: boolean) {
    return new Promise((resolve) => {
      try {
        const proofUrl = this.getProofUrl(proof)
        fetch(proofUrl).then((res) => {
          if (res.status === 200) {
            res.text().then((text) => {
              // Validate identity in provided proof body/tags if required
              if (this.shouldValidateIdentityInBody() 
                && proof.identifier !== this.getProofIdentity(text)) {
                return resolve(proof)
              }

              const proofText = this.getProofStatement(text)
              proof.valid = useBitcoinAddress ? 
              containsValidBitcoinProofStatement(proofText, identifier) 
              : containsValidProofStatement(proofText, identifier)
              return resolve(proof)
            })
          } else {
            console.error(`Proof url ${proofUrl} returned unexpected http status ${res.status}.
              Unable to validate proof.`)
            proof.valid = false
            resolve(proof)
          }
        }).catch((err) => {
          console.error(err)
          proof.valid = false
          resolve(proof)
        })
      } catch (e) {
        console.error(e)
        proof.valid = false
        resolve(proof)
      }
    })
  }

  static getBaseUrls() {
    return []
  }

  static getProofIdentity(searchText: string) {
    return searchText
  }

  static getProofStatement(searchText: string) {
    return searchText
  }

  static shouldValidateIdentityInBody() {
    return false
  }

  static getProofUrl(proof: { proof_url: string, identifier: string, service: string }) {
    const baseUrls = this.getBaseUrls()
    for (let i = 0; i < baseUrls.length; i++) {
      if (proof.proof_url.toLowerCase().startsWith(`${baseUrls[i]}${proof.identifier}`)) {
        return proof.proof_url
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

}
