import { Service } from "./service"

class Twitter extends Service {
  static validateProof(proof) {
    return new Promise((resolve, reject) => {
      try {
        let proofUrl = getProofUrl(proof)
        // TODO: validate proof
        proof.valid = true
        resolve(proof)
      } catch(e) {
        proof.valid = false
        resolve(proof)
      }
    })
  }

  static getBaseUrls() {
    const baseUrls = ["https://twitter.com/"]
    return baseUrls
  }

  static getProofUrl(proof) {
    return super.getProofUrl(proof)
  }
}


export { Twitter }
