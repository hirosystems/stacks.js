/* @flow */
import cheerio from 'cheerio'
import { Service } from './service'

class LinkedIn extends Service {
  static getBaseUrls() {
    const baseUrls = [
      'https://www.linkedin.com/feed/update/',
      'http://www.linkedin.com/feed/update/',
      'www.linkedin.com/feed/update/'
    ]
    return baseUrls
  }

  static getProofUrl(proof: Object) {
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

  static shouldValidateIdentityInBody() {
    return true
  }

  static getProofIdentity(searchText: string) {
    const $ = cheerio.load(searchText)
    const profileLink = $('.author-profile__view-profile')

    if (profileLink !== undefined) {
      if (profileLink.attr('href') === undefined) {
        return ''
      }
      return profileLink.attr('href').split('/').pop().split('?')[0]
    } else {
      return ''
    }
  }

  static getProofStatement(searchText: string) {
    const $ = cheerio.load(searchText)
    const postContent = $('.share-update-card__update-text')
    let statement = ''

    if (postContent !== undefined) {
      statement = postContent.text()
    }

    return statement
  }
}

export { LinkedIn }
