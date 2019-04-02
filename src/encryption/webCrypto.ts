
let webCryptoCached: Promise<Crypto> = null

export async function getWebCrypto(): Promise<Crypto> {
  if (typeof self !== 'undefined' && self.crypto && self.crypto.subtle) {
    // TODO: ensure our usage of WebCrypto API works in all browsers we support,
    // otherwise we may need https://www.npmjs.com/package/webcrypto-liner
    return self.crypto
  } else {
    if (webCryptoCached === null) {
      webCryptoCached = (async () => {
        const { default: WebCrypto } = await import('node-webcrypto-ossl')
        const webCryptoInstance = new WebCrypto()
        return webCryptoInstance
      })()
    }
    return webCryptoCached
  }
}
