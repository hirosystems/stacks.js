/* @flow */
import { Service } from './service'
import cheerio from 'cheerio'

class Facebook extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://facebook.com/', 'https://www.facebook.com/']
    return baseUrls
  }

  static getProofUrl(proof: Object) {
    return this.normalizeFacebookUrl(proof)
  }

  /* Facebook url proofs should start with www. */
  static normalizeFacebookUrl(proof: Object) {
    let proofUrl = super.getProofUrl(proof)
    if (proofUrl.startsWith('https://facebook.com')) {
      const tokens = proofUrl.split('https://facebook.com')
      proofUrl = `https://www.facebook.com${tokens[1]}`
    }
    const tokens = proofUrl.split('https://www.facebook.com/')[1].split('/posts/')
    const postId = tokens[1]
    proofUrl = `https://www.facebook.com/${proof.identifier}/posts/${postId}`
    return proofUrl
  }

  static getProofStatement(searchText: string) {
    const $ = cheerio.load(searchText)
    const statement = $('meta[name="description"]').attr('content')
    return (statement !== undefined) ? statement.trim() : ''
  }
}

export { Facebook }
