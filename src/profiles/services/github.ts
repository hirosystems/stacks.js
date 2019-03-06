
import { Service } from './service'

class Github extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://gist.github.com/', 'http://gist.github.com', 'gist.github.com']
    return baseUrls
  }

  static normalizeUrl(proof: any) {
    return ''
  }

  static getProofUrl(proof: any) {
    const baseUrls = this.getBaseUrls()
    let proofUrl = proof.proof_url.toLowerCase()

    proofUrl = super.prefixScheme(proofUrl)

    for (let i = 0; i < baseUrls.length; i++) {
      const requiredPrefix = `${baseUrls[i]}${proof.identifier}`.toLowerCase()
      if (proofUrl.startsWith(requiredPrefix)) {
        const raw = proofUrl.endsWith('/') ? 'raw' : '/raw'
        return `${proofUrl}${raw}`
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }
}

export { Github }
