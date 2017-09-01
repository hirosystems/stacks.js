import { Service } from './service'
import cheerio from 'cheerio'

class Github extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://gist.github.com/']
    return baseUrls
  }

  static getProofStatement(searchText) {
    const $ = cheerio.load(searchText)

    const text = $('.gist-content')
            .find('.file')
            .find('table')
            .text()
            .trim()

    return text
  }
}

export { Github }
