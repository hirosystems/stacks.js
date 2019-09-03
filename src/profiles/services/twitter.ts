
import * as cheerio from 'cheerio'
import { Service } from './service'
import { Proof } from './proof'

class Twitter extends Service {
  static getBaseUrls() {
    const baseUrls = [
      'https://twitter.com/',
      'http://twitter.com/',
      'twitter.com/'
    ]
    return baseUrls
  }

  static normalizeUrl(proof: Proof) {
    return ''
  }

  static getProofStatement(searchText: string) {
    const $ = cheerio.load(searchText)
    const statement = $('meta[property="og:description"]').attr('content')
    if (statement !== undefined) {
      return statement.trim().replace('“', '').replace('”', '')
    } else {
      return ''
    }
  }
}

export { Twitter }
