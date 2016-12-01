import { Service } from "./service"

export class Github extends Service {

  static isValidProof(identifier, username, proofUrl) {
    let valid = super.isValidProof(identifier, username, proofUrl)

    return valid
  }
}
