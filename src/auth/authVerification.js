import fetch from 'isomorphic-fetch'
import { decodeToken, TokenVerifier } from 'jsontokens'
import { getAddressFromDID, publicKeyToAddress } from '../index'

export function doSignaturesMatchPublicKeys(token) {
  const payload = decodeToken(token).payload
  const publicKeys = payload.public_keys
  if (publicKeys.length === 1) {
    const publicKey = publicKeys[0]
    try {
      const tokenVerifier = new TokenVerifier('ES256k', publicKey)
      const signatureVerified = tokenVerifier.verify(token)
      if (signatureVerified) {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  } else {
    throw new Error('Multiple public keys are not supported')
  }
}

export function doPublicKeysMatchIssuer(token) {
  const payload = decodeToken(token).payload
  const publicKeys = payload.public_keys
  const addressFromIssuer = getAddressFromDID(payload.iss)

  if (publicKeys.length === 1) {
    const addressFromPublicKeys = publicKeyToAddress(publicKeys[0])
    if (addressFromPublicKeys === addressFromIssuer) {
      return true
    }
  } else {
    throw new Error('Multiple public keys are not supported')
  }

  return false
}

export function doPublicKeysMatchUsername(token, nameLookupURL) {
  return new Promise((resolve) => {
    const payload = decodeToken(token).payload

    if (!payload.username) {
      resolve(true)
      return
    }

    if (payload.username === null) {
      resolve(true)
      return
    }

    if (nameLookupURL === null) {
      resolve(false)
      return
    }

    const username = payload.username
    const url = `${nameLookupURL.replace(/\/$/, '')}/${username}`

    try {
      fetch(url)
        .then(response => response.text())
        .then(responseText => JSON.parse(responseText))
        .then((responseJSON) => {
          if (Object.prototype.hasOwnProperty.call(responseJSON, 'address')) {
            const nameOwningAddress = responseJSON.address
            const addressFromIssuer = getAddressFromDID(payload.iss)
            if (nameOwningAddress === addressFromIssuer) {
              resolve(true)
            } else {
              resolve(false)
            }
          } else {
            resolve(false)
          }
        })
        .catch(() => {
          resolve(false)
        })
    } catch (e) {
      resolve(false)
    }
  })
}

export function isIssuanceDateValid(token) {
  const payload = decodeToken(token).payload
  if (payload.iat) {
    if (typeof payload.iat !== 'number') {
      return false
    }
    const issuedAt = new Date(payload.iat * 1000) // JWT times are in seconds
    if (new Date().getTime() < issuedAt.getTime()) {
      return false
    } else {
      return true
    }
  } else {
    return true
  }
}

export function isExpirationDateValid(token) {
  const payload = decodeToken(token).payload
  if (payload.exp) {
    if (typeof payload.exp !== 'number') {
      return false
    }
    const expiresAt = new Date(payload.exp * 1000) // JWT times are in seconds
    if (new Date().getTime() > expiresAt.getTime()) {
      return false
    } else {
      return true
    }
  } else {
    return true
  }
}

export function verifyAuthRequest(token) {
  return new Promise((resolve, reject) => {
    if (decodeToken(token).header.alg === 'none') {
      reject('Token must be signed in order to be verified')
    }

    Promise.all([
      isExpirationDateValid(token),
      isIssuanceDateValid(token),
      doSignaturesMatchPublicKeys(token),
      doPublicKeysMatchIssuer(token),
    ]).then((values) => {
      if (values.every(Boolean)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

export function verifyAuthResponse(token, nameLookupURL) {
  return new Promise((resolve) => {
    Promise.all([
      isExpirationDateValid(token),
      isIssuanceDateValid(token),
      doSignaturesMatchPublicKeys(token),
      doPublicKeysMatchIssuer(token),
      doPublicKeysMatchUsername(token, nameLookupURL),
    ]).then((values) => {
      if (values.every(Boolean)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}
