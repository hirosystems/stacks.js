import { Service, CheerioModuleType } from './service'
import { AccountProofInfo } from '../profileProofs'

class Twitter extends Service {
  getBaseUrls() {
    const baseUrls = [
      'https://twitter.com/',
      'http://twitter.com/',
      'twitter.com/'
    ]
    return baseUrls
  }

  normalizeUrl(_proof: AccountProofInfo) {
    return ''
  }

  getProofStatement(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const statement = $('meta[property="og:description"]').attr('content')
    if (statement !== undefined) {
      return statement.trim().replace('“', '').replace('”', '')
    } else {
      return ''
    }
  }

  getProofUrl(proof: AccountProofInfo): string {
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

export { Twitter }
