import { Service, CheerioModuleType } from './service'
import { AccountProofInfo } from '../profileProofs'

class LinkedIn extends Service {
  getBaseUrls() {
    const baseUrls = [
      'https://www.linkedin.com/feed/update/',
      'http://www.linkedin.com/feed/update/',
      'www.linkedin.com/feed/update/'
    ]
    return baseUrls
  }

  getProofUrl(proof: AccountProofInfo) {
    const baseUrls = this.getBaseUrls()
    
    let proofUrl = proof.proof_url.toLowerCase()
    proofUrl = super.prefixScheme(proofUrl)

    for (let i = 0; i < baseUrls.length; i++) {
      if (proofUrl.startsWith(`${baseUrls[i]}`)) {
        return proofUrl
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

  normalizeUrl(_proof: AccountProofInfo) {
    return ''
  }

  shouldValidateIdentityInBody() {
    return true
  }

  getProofIdentity(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const profileLink = $('body > main header a')

    if (profileLink !== undefined) {
      if (profileLink.attr('href') === undefined) {
        return ''
      }
      const url = profileLink.attr('href')

      // Parse URL for identifier
      const identifier = url.split('?').shift().split('/').pop()

      return identifier
    } else {
      return ''
    }
  }

  getProofStatement(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const postContent = $('head > meta[property="og:title"]')
    let statement = ''

    if (postContent !== undefined) {
      statement = postContent.attr('content')
    }

    return statement
  }
}

export { LinkedIn }
