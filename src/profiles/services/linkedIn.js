/* @flow */
import { Service } from './service'
import cheerio from 'cheerio'

class LinkedIn extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://www.linkedin.com/feed/update/']
    return baseUrls
  }

  static getProofUrl(proof: Object) {
    const baseUrls = this.getBaseUrls()
    for (let i = 0; i < baseUrls.length; i++) {
      if (proof.proof_url.startsWith(`${baseUrls[i]}`)) {
        return proof.proof_url
      }
    }
    throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
  }

  static shouldValidateIdentityInBody() {
    return true
  }

  static getProofIdentity(searchText: string) {
    const $ = cheerio.load(searchText)
    const profileLink = $('article').find('.post-meta__profile-link')

    if (profileLink !== undefined) {
      return profileLink.attr('href').split('/').pop()
    } else {
      return ''
    }
  }

  static getProofStatement(searchText: string) {
    const $ = cheerio.load(searchText)
    const postContent = $('article').find('.commentary')
    let statement = ''

    if (postContent !== undefined) {
      statement = postContent.text()
    }

    return statement
  }
}

export { LinkedIn }
