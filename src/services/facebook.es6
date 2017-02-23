import { Service } from "./service"

class Facebook extends Service {
  static getBaseUrls() {
    const baseUrls = ["https://facebook.com/", "https://www.facebook.com"]
    return baseUrls
  }

  static getProofUrl(proof) {
    let proofUrl = super.getProofUrl(proof)
    return this.normalizeFacebookUrl(proofUrl)
  }

  /* Facebook url proofs should start with www. */
  static normalizeFacebookUrl(proofUrl) {
    if(proofUrl.startsWith("https://facebook.com")) {
      let tokens = proofUrl.split("https://facebook.com")
      proofUrl = "https://www.facebook.com" + tokens[1]
    }
    let tokens = proofUrl.split("https://www.facebook.com/")[1].split("/posts/")
    let username = tokens[0].replace(".", "")
    let postId = tokens[1]
    proofUrl = "https://www.facebook.com/" + username + "/posts/" + postId
    return proofUrl
  }
}

export { Facebook }