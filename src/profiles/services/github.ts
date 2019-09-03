
import { Service } from './service'
import { Proof } from './proof'

class Github extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://gist.github.com/', 'http://gist.github.com', 'gist.github.com']
    return baseUrls
  }

  static normalizeUrl(proof: Proof) {
    return ''
  }

  static getProofUrl(proof: Proof) {
    const baseUrls = this.getBaseUrls()
    let proofUrl = proof.proofUrl.toLowerCase()

    proofUrl = super.prefixScheme(proofUrl)

    for (let i = 0; i < baseUrls.length; i++) {
      const requiredPrefix = `${baseUrls[i]}${proof.identifier}`.toLowerCase()
      if (proofUrl.startsWith(requiredPrefix)) {
        const raw = proofUrl.endsWith('/') ? 'raw' : '/raw'
        return `${proofUrl}${raw}`
      }
    }
    throw new Error(`Proof url ${proof.proofUrl} is not valid for service ${proof.service}`)
  }
}

export { Github }
