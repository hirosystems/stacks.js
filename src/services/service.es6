import { containsValidProofStatement } from "../utils"
export class Service {

  static validateProof(proof) {
    return new Promise((resolve, reject) => {
      console.error("The Service class should not be used directly.")
      proof.valid = true
      resolve(proof)
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
