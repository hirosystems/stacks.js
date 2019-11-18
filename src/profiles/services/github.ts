
import { Service, CheerioModuleType } from './service'
import { AccountProofInfo } from '../profileProofs'

class Github extends Service {
  getBaseUrls() {
    const baseUrls = ['https://gist.github.com/', 'http://gist.github.com', 'gist.github.com']
    return baseUrls
  }

  normalizeUrl(_proof: AccountProofInfo) {
    return ''
  }

  getProofUrl(proof: AccountProofInfo) {
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

  getProofStatement(searchText: string, _cheerio: CheerioModuleType) {
    return searchText
  }
}

export { Github }
