
import url from 'url'
import { ECPair, address, crypto } from 'bitcoinjs-lib'
import { config } from './config'
import { Logger } from './logger'

/**
 *  @ignore
 */
export const BLOCKSTACK_HANDLER = 'blockstack'

/**
 * Time
 * @private
 * @ignore
 */
export function nextYear() {
  return new Date(
    new Date().setFullYear(
      new Date().getFullYear() + 1
    )
  )
}

/**
 * Time
 * @private
 * @ignore
 */
export function nextMonth() {
  return new Date(
    new Date().setMonth(
      new Date().getMonth() + 1
    )
  )
}

/**
 * Time
 * @private
 * @ignore
 */
export function nextHour() {
  return new Date(
    new Date().setHours(
      new Date().getHours() + 1
    )
  )
}

/**
 * Query Strings
 * @private
 * @ignore
 */

export function updateQueryStringParameter(uri: string, key: string, value: string) {
  const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i')
  const separator = uri.indexOf('?') !== -1 ? '&' : '?'
  if (uri.match(re)) {
    return uri.replace(re, `$1${key}=${value}$2`)
  } else {
    return `${uri}${separator}${key}=${value}`
  }
}

/**
 * Versioning
 * @param {string} v1 - the left half of the version inequality
 * @param {string} v2 - right half of the version inequality
 * @returns {bool} iff v1 >= v2
 * @private
 * @ignore
 */

export function isLaterVersion(v1: string, v2: string) {
  if (v1 === undefined) {
    v1 = '0.0.0'
  }

  if (v2 === undefined) {
    v2 = '0.0.0'
  }

  const v1tuple = v1.split('.').map(x => parseInt(x, 10))
  const v2tuple = v2.split('.').map(x => parseInt(x, 10))

  for (let index = 0; index < v2.length; index++) {
    if (index >= v1.length) {
      v2tuple.push(0)
    }
    if (v1tuple[index] < v2tuple[index]) {
      return false
    }
  }
  return true
}

/**
 * Time
 * @private
 * @ignore
 */
export function hexStringToECPair(skHex: string) {
  const ecPairOptions = {
    network: config.network.layer1,
    compressed: true
  }

  if (skHex.length === 66) {
    if (skHex.slice(64) !== '01') {
      throw new Error('Improperly formatted private-key hex string. 66-length hex usually '
                      + 'indicates compressed key, but last byte must be == 1')
    }
    return ECPair.fromPrivateKey(Buffer.from(skHex.slice(0, 64), 'hex'), ecPairOptions)
  } else if (skHex.length === 64) {
    ecPairOptions.compressed = false
    return ECPair.fromPrivateKey(Buffer.from(skHex, 'hex'), ecPairOptions)
  } else {
    throw new Error('Improperly formatted private-key hex string: length should be 64 or 66.')
  }
}

/**
 * 
 * @ignore
 */
export function ecPairToHexString(secretKey: ECPair) {
  const ecPointHex = secretKey.privateKey.toString('hex')
  if (secretKey.compressed) {
    return `${ecPointHex}01`
  } else {
    return ecPointHex
  }
}

/**
 * Time
 * @private
 * @ignore
 */
export function ecPairToAddress(keyPair: ECPair) {
  return address.toBase58Check(crypto.hash160(keyPair.publicKey), keyPair.network.pubKeyHash)
}

/**
 * UUIDs
 * @private
 * @ignore
 */
export function makeUUID4() {
  let d = new Date().getTime()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now() // use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/**
 * Checks if both urls pass the same origin check & are absolute
 * @param  {[type]}  uri1 first uri to check
 * @param  {[type]}  uri2 second uri to check
 * @return {Boolean} true if they pass the same origin check
 * @private
 * @ignore
 */
export function isSameOriginAbsoluteUrl(uri1: string, uri2: string) {
  const parsedUri1 = url.parse(uri1)
  const parsedUri2 = url.parse(uri2)

  const port1 = parseInt(parsedUri1.port || '0', 10) | 0 || (parsedUri1.protocol === 'https:' ? 443 : 80)
  const port2 = parseInt(parsedUri2.port || '0', 10) | 0 || (parsedUri2.protocol === 'https:' ? 443 : 80)

  const match = {
    scheme: parsedUri1.protocol === parsedUri2.protocol,
    hostname: parsedUri1.hostname === parsedUri2.hostname,
    port: port1 === port2,
    absolute: (uri1.includes('http://') || uri1.includes('https://'))
    && (uri2.includes('http://') || uri2.includes('https://'))
  }

  return match.scheme && match.hostname && match.port && match.absolute
}

/**
 * Runtime check for the existence of the global `window` object and the 
 * given API key (name) on `window`. Throws an error if either are not
 * available in the current environment. 
 * @param fnDesc The function name to include in the thrown error and log.
 * @param name The name of the key on the `window` object to check for.
 * @hidden
 */
export function checkWindowAPI(fnDesc: string, name: string) {
  const api = typeof window !== 'undefined' && window[name]
  if (!api) {
    const errMsg = `\`${fnDesc}\` uses the \`window.${name}\` API which is `
      + ' not available in the current environment.'
    Logger.error(errMsg)
    throw new Error(errMsg)
  }
}
