
export function isSubtleCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

export const NO_CRYPTO_LIB = 'Crypto lib not found. Either the WebCrypto "crypto.subtle" or Node.js "crypto" module must be available.'

export interface WebCryptoLib {
  lib: SubtleCrypto;
  name: 'subtleCrypto'
}

export interface NodeCryptoLib {
  lib: typeof import('crypto');
  name: 'nodeCrypto'
}

// Make async for future version which may lazy load.
// eslint-disable-next-line @typescript-eslint/require-await
export async function getCryptoLib(): Promise<WebCryptoLib | NodeCryptoLib> {
  if (isSubtleCryptoAvailable()) {
    return {
      lib: crypto.subtle,
      name: 'subtleCrypto'
    }
  } else {
    try {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line import/no-nodejs-modules,no-restricted-modules,global-require,@typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto') as typeof import('crypto')
      return {
        lib: nodeCrypto,
        name: 'nodeCrypto'
      }
    } catch (error) {
      throw new Error(NO_CRYPTO_LIB)
    }
  }
}
