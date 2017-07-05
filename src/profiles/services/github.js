import { Service } from './service'

class Github extends Service {
  static getBaseUrls() {
    const baseUrls = ['https://gist.github.com/']
    return baseUrls
  }
}

export { Github }
