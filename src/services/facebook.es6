import { Service } from "./service"

class Facebook extends Service {
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
    const baseUrls = ["https://facebook.com/", "https://www.facebook.com"]
    return baseUrls
  }

  static getProofUrl(proof) {
    return super.getProofUrl(proof, this.getBaseUrls())
  }
}


export { Facebook }
