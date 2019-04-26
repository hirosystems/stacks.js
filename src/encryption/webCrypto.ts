
let webCryptoCached: Promise<Crypto> = null

export async function getWebCrypto(): Promise<Crypto> {
  if (typeof self !== 'undefined' && self.crypto && self.crypto.subtle) {
    // TODO: ensure our usage of WebCrypto API works in all browsers we support,
    // otherwise we may need https://www.npmjs.com/package/webcrypto-liner
    return self.crypto
  } else {
    if (webCryptoCached === null) {
      webCryptoCached = (async () => {
        try {
          const { default: WebCrypto } = await import('node-webcrypto-ossl')
          const webCryptoInstance = new WebCrypto()
          return webCryptoInstance
        } catch (error) {
          console.error('The WebCrypto API is not available in this environment, '
            + 'and the `node-webcrypto-ossl` module could not be imported. If running '
            + 'within Node environment then ensure the `node-webcrypto-ossl` peer '
            + 'dependency is installed.')
          throw error
        }
      })()
    }
    return webCryptoCached
  }
}
