import { Service, CheerioModuleType } from './service'
import { AccountProofInfo } from '../profileProofs'

class Instagram extends Service {
  getBaseUrls() {
    const baseUrls = ['https://www.instagram.com/', 'https://instagram.com/']
    return baseUrls
  }

  getProofUrl(proof: AccountProofInfo) {
    const baseUrls = this.getBaseUrls()
    const normalizedProofUrl = this.normalizeUrl(proof)

    for (let i = 0; i < baseUrls.length; i++) {
      if (normalizedProofUrl.startsWith(`${baseUrls[i]}`)) {
        return normalizedProofUrl
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

  normalizeUrl(proof: AccountProofInfo) {
    let proofUrl = proof.proof_url
    proofUrl = super.prefixScheme(proofUrl)

    if (proofUrl.startsWith('https://instagram.com')) {
      const tokens = proofUrl.split('https://instagram.com')
      proofUrl = `https://www.instagram.com${tokens[1]}`
    }
    return proofUrl
  }

  shouldValidateIdentityInBody() {
    return true
  }

  getProofIdentity(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const username = $('meta[property="og:description"]').attr('content')
    if (username !== undefined && username.split(':').length > 1) {
      return username.split(':')[0].match(/(@\w+)/)[0].substr(1)
    } else {
      return ''
    }
  }

  getProofStatement(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const statement = $('meta[property="og:description"]')
      .attr('content')

    if (statement !== undefined && statement.split(':').length > 1) {
      return statement.split(':')[1].trim().replace('“', '').replace('”', '')
    } else {
      return ''
    }
  }
}

export { Instagram }
