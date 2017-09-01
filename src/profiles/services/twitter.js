import { Service } from './service'
import cheerio from 'cheerio'

class Twitter extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://twitter.com/']
    return baseUrls
  }

  static getProofStatement(searchText) {
    const $ = cheerio.load(searchText)
    return $('meta[property="og:description"]').attr('content').trim()
  }
}

export { Twitter }
