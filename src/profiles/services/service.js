import 'isomorphic-fetch'
import { containsValidProofStatement, containsValidBitcoinProofStatement } from './serviceUtils'

export class Service {
  static validateProof(proof, identifier, useBitcoinAddress) {
    return new Promise((resolve) => {
      try {
        const proofUrl = this.getProofUrl(proof)
        fetch(proofUrl).then((res) => {
          if (res.status === 200) {
            res.text().then((text) => {
              const proofText = this.getProofStatement(text)
              proof.valid = useBitcoinAddress ? 
              containsValidBitcoinProofStatement(proofText, identifier) 
              : containsValidProofStatement(proofText, identifier)
              resolve(proof)
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

  static getProofUrl(proof) {
    const baseUrls = this.getBaseUrls()
    for (let i = 0; i < baseUrls.length; i++) {
      if (proof.proof_url.toLowerCase().startsWith(`${baseUrls[i]}${proof.identifier}`)) {
        return proof.proof_url
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

}
