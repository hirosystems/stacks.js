'use strict'

import { Service } from "./service"

class Facebook extends Service {
  static getBaseUrls() {
    const baseUrls = ["https://facebook.com/", "https://www.facebook.com"]
    return baseUrls
  }

  static getProofUrl(proof) {
    return this.normalizeFacebookUrl(proof)
  }

  /* Facebook url proofs should start with www. */
  static normalizeFacebookUrl(proof) {
    let proofUrl = super.getProofUrl(proof)
    if(proofUrl.startsWith("https://facebook.com")) {
      let tokens = proofUrl.split("https://facebook.com")
      proofUrl = "https://www.facebook.com" + tokens[1]
    }
    let tokens = proofUrl.split("https://www.facebook.com/")[1].split("/posts/")
    let postId = tokens[1]
    proofUrl = "https://www.facebook.com/" + proof.identifier + "/posts/" + postId
    return proofUrl
  }
}

export { Facebook }
