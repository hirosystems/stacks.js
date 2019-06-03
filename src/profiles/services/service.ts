
import 'cross-fetch/polyfill'
import { containsValidProofStatement, containsValidAddressProofStatement } from './serviceUtils'
import { fetchPrivate } from '../../fetchUtil'

/**
 * @ignore
 */
export class Service {
  static validateProof(proof: any,
                       ownerAddress: string,
                       name: string = null) {
    let proofUrl: string
    return Promise.resolve()
      .then(() => {
        proofUrl = this.getProofUrl(proof)
        return fetchPrivate(proofUrl)
      })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error(`Proof url ${proofUrl} returned unexpected http status ${res.status}.
              Unable to validate proof.`)
        }
        return res.text()
      })
      .then((text) => {
        // Validate identity in provided proof body/tags if required
        if (this.shouldValidateIdentityInBody()
            && proof.identifier !== this.getProofIdentity(text)) {
          return proof
        }
        const proofText = this.getProofStatement(text)
        proof.valid = containsValidProofStatement(proofText, name)
          || containsValidAddressProofStatement(proofText, ownerAddress)
        return proof
      })
      .catch((error) => {
        console.error(error)
        proof.valid = false
        return proof
      })
  }

  static getBaseUrls(): string[] {
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

  static prefixScheme(proofUrl: string) {
    if (!proofUrl.startsWith('https://') && !proofUrl.startsWith('http://')) {
      return `https://${proofUrl}`
    } else if (proofUrl.startsWith('http://')) {
      return proofUrl.replace('http://', 'https://')
    } else {
      return proofUrl
    }
  }

  static getProofUrl(proof: any): string {
    const baseUrls = this.getBaseUrls()

    let proofUrl = proof.proof_url.toLowerCase()
    proofUrl = this.prefixScheme(proofUrl)

    for (let i = 0; i < baseUrls.length; i++) {
      const requiredPrefix = `${baseUrls[i]}${proof.identifier}`.toLowerCase()
      if (proofUrl.startsWith(requiredPrefix)) {
        return proofUrl
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }
}
