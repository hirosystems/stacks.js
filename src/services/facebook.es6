import { Service } from "./service"
import { containsValidProofStatement } from "../utils"

export class Facebook extends Service {


  static isValidProof(identifier, username, proofUrl) {
    let valid = super.isValidProof(identifier, username, proofUrl)




    return valid
  }
}
