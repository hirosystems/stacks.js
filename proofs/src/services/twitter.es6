import { Service } from "./service"

class Twitter extends Service {

  static getBaseUrls() {
    const baseUrls = ["https://twitter.com/"]
    return baseUrls
  }

}


export { Twitter }
