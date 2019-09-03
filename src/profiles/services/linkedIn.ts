
import * as cheerio from 'cheerio'
import { Service } from './service'
import { Proof } from './proof'

class LinkedIn extends Service {
  static getBaseUrls() {
    const baseUrls = [
      'https://www.linkedin.com/feed/update/',
      'http://www.linkedin.com/feed/update/',
      'www.linkedin.com/feed/update/'
    ]
    return baseUrls
  }

  static getProofUrl(proof: Proof) {
    const baseUrls = this.getBaseUrls()

    let proofUrl = proof.proofUrl.toLowerCase()
    proofUrl = super.prefixScheme(proofUrl)

    for (let i = 0; i < baseUrls.length; i++) {
      if (proofUrl.startsWith(`${baseUrls[i]}`)) {
        return proofUrl
      }
    }
    throw new Error(`Proof url ${proof.proofUrl} is not valid for service ${proof.service}`)
  }

  static normalizeUrl(proof: Proof) {
    return ''
  }

  static shouldValidateIdentityInBody() {
    return true
  }

  static getProofIdentity(searchText: string) {
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

  static getProofStatement(searchText: string) {
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
