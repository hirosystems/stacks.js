import { Service, CheerioModuleType } from './service'
import { AccountProofInfo } from '../profileProofs'

class Facebook extends Service {
  getProofUrl(proof: AccountProofInfo) {
    return this.normalizeUrl(proof)
  }

  normalizeUrl(proof: AccountProofInfo) {
    let proofUrl = proof.proof_url.toLowerCase()
    const urlRegex = /(?:http[s]*:\/\/){0,1}(?:[a-zA-Z0-9-]+\.)+facebook\.com/

    proofUrl = super.prefixScheme(proofUrl)

    if (proofUrl.startsWith('https://facebook.com')) {
      let tokens = proofUrl.split('https://facebook.com')
      proofUrl = `https://www.facebook.com${tokens[1]}`
      tokens = proofUrl.split('https://www.facebook.com/')[1].split('/posts/')
      const postId = tokens[1]
      proofUrl = `https://www.facebook.com/${proof.identifier}/posts/${postId}`
    } else if (proofUrl.match(urlRegex)) {
      const tokens = proofUrl.split('facebook.com/')[1].split('/posts/')
      const postId = tokens[1]
      proofUrl = `https://www.facebook.com/${proof.identifier}/posts/${postId}`
    } else {
      throw new Error(`Proof url ${proof.proof_url} is not valid for service ${proof.service}`)
    }

    return proofUrl
  }

  getProofStatement(searchText: string, cheerio: CheerioModuleType) {
    const $ = cheerio.load(searchText)
    const statement = $('meta[name="description"]').attr('content')
    return (statement !== undefined) ? statement.trim() : ''
  }

  getBaseUrls(): string[] {
    return []
  }
}

export { Facebook }
