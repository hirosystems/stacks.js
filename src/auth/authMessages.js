'use strict'

require('isomorphic-fetch')

import {
  TokenSigner, TokenVerifier, decodeToken, createUnsecuredToken,
  SECP256K1Client
} from 'jsontokens'

import {
  makeDIDFromAddress, getDIDType, getAddressFromDID,
  makeUUID4,
  nextMonth, nextHour,
  publicKeyToAddress
} from '../index'

export function makeAuthRequest(privateKey,
                                domain_name,
                                manifestURI=null,
                                redirectURI=null,
                                scopes=[],
                                expiresAt=nextHour().getTime()) {
  let token = null

  if (domain_name === null) {
    throw new Error("Invalid app domain name")
  }
  if (manifestURI === null) {
    manifestURI = domain_name + '/manifest.json'
  }
  if (redirectURI === null) {
    redirectURI = domain_name
  }

  /* Create the payload */
  let payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime()/1000), // JWT times are in seconds
    exp: Math.floor(expiresAt/1000), // JWT times are in seconds
    iss: null,
    public_keys: [],
    domain_name: domain_name,
    manifest_uri: manifestURI,
    redirect_uri: redirectURI,
    scopes: scopes
  }

  if (privateKey === null) {
    /* Create an unsecured token and return it */
    token = createUnsecuredToken(payload)
  } else {
    /* Convert the private key to a public key to an issuer */
    const publicKey = SECP256K1Client.derivePublicKey(privateKey)
    payload.public_keys = [publicKey]
    const address = publicKeyToAddress(publicKey)
    payload.iss = makeDIDFromAddress(address)
    /* Sign and return the token */
    const tokenSigner = new TokenSigner('ES256k', privateKey)
    token = tokenSigner.sign(payload)
  }

  return token
}

export function makeAuthResponse(privateKey,
                                 profile={},
                                 username=null,
                                 expiresAt=nextMonth().getTime()) {
  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)
  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime()/1000), // JWT times are in seconds
    exp: Math.floor(expiresAt/1000), // JWT times are in seconds
    iss: makeDIDFromAddress(address),
    public_keys: [publicKey],
    profile: profile,
    username: username
  }
  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}

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
    } catch(e) {
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
  return new Promise((resolve, reject) => {
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
    const url = nameLookupURL.replace(/\/$/, "") + '/' + username

    try {
      fetch(url)
        .then(response => response.text())
        .then(responseText => JSON.parse(responseText))
        .then(responseJSON => {
          if (responseJSON.hasOwnProperty('address')) {
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
        .catch((e) => {
          resolve(false)
        })
    } catch(e) {
      resolve(false)
    }

  })
}

export function isIssuanceDateValid(token) {
  const payload = decodeToken(token).payload
  if (payload.iat) {
    if (typeof payload.iat !== "number") {
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
    if (typeof payload.exp !== "number") {
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
      reject("Token must be signed in order to be verified")
    }

    Promise.all([
      isExpirationDateValid(token),
      isIssuanceDateValid(token),
      doSignaturesMatchPublicKeys(token),
      doPublicKeysMatchIssuer(token)
    ]).then(values => {
      if (values.every(Boolean)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

export function verifyAuthResponse(token, nameLookupURL) {
  return new Promise((resolve, reject) => {
    Promise.all([
      isExpirationDateValid(token),
      isIssuanceDateValid(token),
      doSignaturesMatchPublicKeys(token),
      doPublicKeysMatchIssuer(token),
      doPublicKeysMatchUsername(token)
    ]).then(values => {
      if (values.every(Boolean)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}
