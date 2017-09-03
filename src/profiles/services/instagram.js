import { Service } from './service'
import cheerio from 'cheerio'

class Instagram extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://www.instagram.com/']
    return baseUrls
  }

  static getProofUrl(proof) {
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

  static getProofIdentity(searchText) {
    const $ = cheerio.load(searchText)
    const username = $('meta[property="og:description"]').attr('content')
    if (username !== undefined && username.split(':').length > 1) {
      return username.split(':')[0].match(/\(([^)]+)\)/)[1].substr(1)
    } else {
      return ''
    }
  }

  static getProofStatement(searchText) {
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
