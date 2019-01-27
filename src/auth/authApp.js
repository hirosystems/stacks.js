/* @flow */
import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { makeAuthRequest, verifyAuthResponse } from './index'
import { BLOCKSTACK_HANDLER, isLaterVersion, hexStringToECPair } from '../utils'
import { getAddressFromDID, makeECPrivateKey } from '../index'
import { LoginFailedError } from '../errors'
import { decryptPrivateKey } from './authMessages'
import {
  BLOCKSTACK_APP_PRIVATE_KEY_LABEL,
  BLOCKSTACK_STORAGE_LABEL,
  BLOCKSTACK_DEFAULT_GAIA_HUB_URL,
  DEFAULT_BLOCKSTACK_HOST,
  DEFAULT_SCOPE
} from './authConstants'

import { BLOCKSTACK_GAIA_HUB_LABEL } from '../storage'

import { extractProfile } from '../profiles'

import { Logger } from '../logger'

import { config } from '../config'

const DEFAULT_PROFILE = {
  '@type': 'Person',
  '@context': 'http://schema.org'
}

/**
 * Fetches the hex value of the transit private key from local storage.
 * @return {String} the hex encoded private key
 * @private
 */
export function getTransitKey() : string {
  const transitKey = localStorage.getItem(BLOCKSTACK_APP_PRIVATE_KEY_LABEL)
  return ((transitKey: any): string)
}

/**
 * Generates a ECDSA keypair to
 * use as the ephemeral app transit private key
 * and stores the hex value of the private key in
 * local storage.
 * @return {String} the hex encoded private key
 */
export function generateAndStoreTransitKey() {
  const transitKey = makeECPrivateKey()
  localStorage.setItem(BLOCKSTACK_APP_PRIVATE_KEY_LABEL, transitKey)
  return transitKey
}

/**
 * Check if a user is currently signed in.
 * @return {Boolean} `true` if the user is signed in, `false` if not.
 */
export function isUserSignedIn() {
  return !!window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL)
}

/**
 * Detects if the native auth-browser is installed and is successfully 
 * launched via a custom protocol URI. 
 * @param {String} authRequest
 * The encoded authRequest to be used as a query param in the custom URI. 
 * @param {String} successCallback
 * The callback that is invoked when the protocol handler was detected. 
 * @param {String} failCallback
 * The callback that is invoked when the protocol handler was not detected. 
 * @return {void}
 */
function detectProtocolLaunch(
  authRequest: string, 
  successCallback: () => void, 
  failCallback: () => void) {
  // Create a unique ID used for this protocol detection attempt.
  const echoReplyID = Math.random().toString(36).substr(2, 9)
  const echoReplyKeyPrefix = 'echo-reply-'
  const echoReplyKey = `${echoReplyKeyPrefix}${echoReplyID}`

  // Use localStorage as a reliable cross-window communication method.
  // Create the storage entry to signal a protocol detection attempt for the
  // next browser window to check.
  window.localStorage.setItem(echoReplyKey, Date.now().toString())
  const cleanUpLocalStorage = () => {
    try {
      window.localStorage.removeItem(echoReplyKey)
      // Also clear out any stale echo-reply keys older than 1 hour.
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i)
        if (storageKey.startsWith(echoReplyKeyPrefix)) {
          const storageValue = window.localStorage.getItem(storageKey)
          if (storageValue === 'success' || (Date.now() - parseInt(storageValue, 10)) > 3600000) {
            window.localStorage.removeItem(storageKey)
          }
        }
      }
    } catch (err) {
      Logger.error('Exception cleaning up echo-reply entries in localStorage')
      Logger.error(err)
    }
  }

  const detectionTimeout = 1000
  let redirectToWebAuthTimer = 0
  const cancelWebAuthRedirectTimer = () => {
    if (redirectToWebAuthTimer) {
      window.clearTimeout(redirectToWebAuthTimer)
      redirectToWebAuthTimer = 0
    }
  }
  const startWebAuthRedirectTimer = (timeout = detectionTimeout) => {
    cancelWebAuthRedirectTimer()
    redirectToWebAuthTimer = window.setTimeout(() => {
      if (redirectToWebAuthTimer) {
        cancelWebAuthRedirectTimer()
        let nextFunc
        if (window.localStorage.getItem(echoReplyKey) === 'success') {
          Logger.info('Protocol echo reply detected.')
          nextFunc = successCallback
        } else {
          Logger.info('Protocol handler not detected.')
          nextFunc = failCallback
        }
        failCallback = () => {}
        successCallback = () => {}
        cleanUpLocalStorage()
        // Briefly wait since localStorage changes can 
        // sometimes be ignored when immediately redirected.
        setTimeout(() => nextFunc(), 100)
      }
    }, timeout)
  }

  startWebAuthRedirectTimer()

  const inputPromptTracker = document.createElement('input')
  inputPromptTracker.type = 'text'
  // Prevent this element from inherited any css.
  inputPromptTracker.style.all = 'initial'
  // Setting display=none on an element prevents them from being focused/blurred.
  // So hide the element using other properties..
  inputPromptTracker.style.opacity = '0'
  inputPromptTracker.style.filter = 'alpha(opacity=0)'
  inputPromptTracker.style.height = '0'
  inputPromptTracker.style.width = '0'

  // If the the focus of a page element is immediately changed then this likely indicates 
  // the protocol handler is installed, and the browser is prompting the user if they want 
  // to open the application. 
  const inputBlurredFunc = () => {
    // Use a timeout of 100ms to ignore instant toggles between blur and focus.
    // Browsers often perform an instant blur & focus when the protocol handler is working
    // but not showing any browser prompts, so we want to ignore those instances.
    let isRefocused = false
    inputPromptTracker.addEventListener('focus', () => { isRefocused = true }, { once: true, capture: true })
    setTimeout(() => {
      if (redirectToWebAuthTimer && !isRefocused) {
        Logger.info('Detected possible browser prompt for opening the protocol handler app.')
        window.clearTimeout(redirectToWebAuthTimer)
        inputPromptTracker.addEventListener('focus', () => {
          if (redirectToWebAuthTimer) {
            Logger.info('Possible browser prompt closed, restarting auth redirect timeout.')
            startWebAuthRedirectTimer()
          }
        }, { once: true, capture: true })
      }
    }, 100)
  }
  inputPromptTracker.addEventListener('blur', inputBlurredFunc, { once: true, capture: true })
  setTimeout(() => inputPromptTracker.removeEventListener('blur', inputBlurredFunc), 200)
  // Flow complains without this check.
  if (document.body) document.body.appendChild(inputPromptTracker)
  inputPromptTracker.focus()
  
  // Detect if document.visibility is immediately changed which is a strong 
  // indication that the protocol handler is working. We don't know for sure and 
  // can't predict future browser changes, so only increase the redirect timeout.
  // This reduces the probability of a false-negative (where local auth works, but 
  // the original page was redirect to web auth because something took too long),
  const pageVisibilityChanged = () => {
    if (document.hidden && redirectToWebAuthTimer) {
      Logger.info('Detected immediate page visibility change (protocol handler probably working).')
      startWebAuthRedirectTimer(3000)
    }
  }
  document.addEventListener('visibilitychange', pageVisibilityChanged, { once: true, capture: true })
  setTimeout(() => document.removeEventListener('visibilitychange', pageVisibilityChanged), 500)


  // Listen for the custom protocol echo reply via localStorage update event.
  window.addEventListener('storage', function replyEventListener(event) {
    if (event.key === echoReplyKey && window.localStorage.getItem(echoReplyKey) === 'success') {
      // Custom protocol worked, cancel the web auth redirect timer.
      cancelWebAuthRedirectTimer()
      inputPromptTracker.removeEventListener('blur', inputBlurredFunc)
      Logger.info('Protocol echo reply detected from localStorage event.')
      // Clean up event listener and localStorage.
      window.removeEventListener('storage', replyEventListener)
      const nextFunc = successCallback
      successCallback = () => {}
      failCallback = () => {}
      cleanUpLocalStorage()
      // Briefly wait since localStorage changes can sometimes 
      // be ignored when immediately redirected.
      setTimeout(() => nextFunc(), 100)
    }
  }, false)

  // Use iframe technique for launching the protocol URI rather than setting `window.location`.
  // This method prevents browsers like Safari, Opera, Firefox from showing error prompts
  // about unknown protocol handler when app is not installed, and avoids an empty
  // browser tab when the app is installed. 
  Logger.info('Attempting protocol launch via iframe injection.')
  const locationSrc = `${BLOCKSTACK_HANDLER}:${authRequest}&echo=${echoReplyID}`
  const iframe = document.createElement('iframe')
  iframe.style.all = 'initial'
  iframe.style.display = 'none'
  iframe.src = locationSrc
  // Flow complains without this check.
  if (document.body) {
    document.body.appendChild(iframe)
  } else {
    Logger.error('document.body is null when attempting iframe injection for protoocol URI launch')
  }
}

/**
 * Redirects the user to the Blockstack browser to approve the sign in request
 * given.
 *
 * The user is redirected to the `blockstackIDHost` if the `blockstack:`
 * protocol handler is not detected. Please note that the protocol handler detection
 * does not work on all browsers.
 * @param  {String} authRequest - the authentication request generated by `makeAuthRequest`
 * @param  {String} blockstackIDHost - the URL to redirect the user to if the blockstack
 *                                     protocol handler is not detected
 * @return {void}
 */
export function redirectToSignInWithAuthRequest(authRequest: string = makeAuthRequest(),
                                                blockstackIDHost: string =
                                                DEFAULT_BLOCKSTACK_HOST) {
  const httpsURI = `${blockstackIDHost}?authRequest=${authRequest}`

  // If they're on a mobile OS, always redirect them to HTTPS site
  if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    Logger.info('detected mobile OS, sending to https')
    window.location = httpsURI
    return
  }

  function successCallback() {
    Logger.info('protocol handler detected')
    // The detection function should open the link for us
  }

  function failCallback() {
    Logger.warn('protocol handler not detected')
    window.location = httpsURI
  }

  detectProtocolLaunch(authRequest, successCallback, failCallback)
}

/**
 * Generates an authentication request and redirects the user to the Blockstack
 * browser to approve the sign in request.
 *
 * Please note that this requires that the web browser properly handles the
 * `blockstack:` URL protocol handler.
 *
 * Most applications should use this
 * method for sign in unless they require more fine grained control over how the
 * authentication request is generated. If your app falls into this category,
 * use `makeAuthRequest` and `redirectToSignInWithAuthRequest` to build your own sign in process.
 *
 * @param {String} [redirectURI=`${window.location.origin}/`]
 * The location to which the identity provider will redirect the user after
 * the user approves sign in.
 * @param  {String} [manifestURI=`${window.location.origin}/manifest.json`]
 * Location of the manifest file.
 * @param  {Array} [scopes=DEFAULT_SCOPE] Defaults to requesting write access to
 * this app's data store.
 * An array of strings indicating which permissions this app is requesting.
 * @return {void}
 */
export function redirectToSignIn(redirectURI: string = `${window.location.origin}/`,
                                 manifestURI: string = `${window.location.origin}/manifest.json`,
                                 scopes: Array<string> = DEFAULT_SCOPE) {
  const authRequest = makeAuthRequest(
    generateAndStoreTransitKey(), redirectURI, manifestURI, scopes
  )
  redirectToSignInWithAuthRequest(authRequest)
}

/**
 * Retrieve the authentication token from the URL query
 * @return {String} the authentication token if it exists otherwise `null`
 */
export function getAuthResponseToken(): string {
  const queryDict = queryString.parse(location.search)
  return queryDict.authResponse ? queryDict.authResponse : ''
}

/**
 * Check if there is a authentication request that hasn't been handled.
 * @return {Boolean} `true` if there is a pending sign in, otherwise `false`
 */
export function isSignInPending() {
  return !!getAuthResponseToken()
}


/**
 * Try to process any pending sign in request by returning a `Promise` that resolves
 * to the user data object if the sign in succeeds.
 *
 * @param {String} nameLookupURL - the endpoint against which to verify public
 * keys match claimed username
 * @param {String} authResponseToken - the signed authentication response token
 * @param {String} transitKey - the transit private key that corresponds to the transit public key
 * that was provided in the authentication request
 * @return {Promise} that resolves to the user data object if successful and rejects
 * if handling the sign in request fails or there was no pending sign in request.
 */
export function handlePendingSignIn(nameLookupURL: string = '',
                                    authResponseToken: string = getAuthResponseToken(),
                                    transitKey: string = getTransitKey()) {
  if (!nameLookupURL) {
    const tokenPayload = decodeToken(authResponseToken).payload
    if (isLaterVersion(tokenPayload.version, '1.3.0')
       && tokenPayload.blockstackAPIUrl !== null && tokenPayload.blockstackAPIUrl !== undefined) {
      // override globally
      Logger.info(`Overriding ${config.network.blockstackAPIUrl} `
        + `with ${tokenPayload.blockstackAPIUrl}`)
      config.network.blockstackAPIUrl = tokenPayload.blockstackAPIUrl
      nameLookupURL = `${tokenPayload.blockstackAPIUrl}/v1/names`
    } 

    nameLookupURL = `${config.network.blockstackAPIUrl}/v1/names/`
  }
  return verifyAuthResponse(authResponseToken, nameLookupURL)
    .then((isValid) => {
      if (!isValid) {
        throw new LoginFailedError('Invalid authentication response.')
      }
      const tokenPayload = decodeToken(authResponseToken).payload
      // TODO: real version handling
      let appPrivateKey = tokenPayload.private_key
      let coreSessionToken = tokenPayload.core_token
      if (isLaterVersion(tokenPayload.version, '1.1.0')) {
        if (transitKey !== undefined && transitKey != null) {
          if (tokenPayload.private_key !== undefined && tokenPayload.private_key !== null) {
            try {
              appPrivateKey = decryptPrivateKey(transitKey, tokenPayload.private_key)
            } catch (e) {
              Logger.warn('Failed decryption of appPrivateKey, will try to use as given')
              try {
                hexStringToECPair(tokenPayload.private_key)
              } catch (ecPairError) {
                throw new LoginFailedError('Failed decrypting appPrivateKey. Usually means'
                                         + ' that the transit key has changed during login.')
              }
            }
          }
          if (coreSessionToken !== undefined && coreSessionToken !== null) {
            try {
              coreSessionToken = decryptPrivateKey(transitKey, coreSessionToken)
            } catch (e) {
              Logger.info('Failed decryption of coreSessionToken, will try to use as given')
            }
          }
        } else {
          throw new LoginFailedError('Authenticating with protocol > 1.1.0 requires transit'
                                   + ' key, and none found.')
        }
      }
      let hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL
      let gaiaAssociationToken
      if (isLaterVersion(tokenPayload.version, '1.2.0')
        && tokenPayload.hubUrl !== null && tokenPayload.hubUrl !== undefined) {
        hubUrl = tokenPayload.hubUrl
      }
      if (isLaterVersion(tokenPayload.version, '1.3.0')
        && tokenPayload.associationToken !== null && tokenPayload.associationToken !== undefined) {
        gaiaAssociationToken = tokenPayload.associationToken
      }

      const userData = {
        username: tokenPayload.username,
        profile: tokenPayload.profile,
        decentralizedID: tokenPayload.iss,
        identityAddress: getAddressFromDID(tokenPayload.iss),
        appPrivateKey,
        coreSessionToken,
        authResponseToken,
        hubUrl,
        gaiaAssociationToken
      }
      const profileURL = tokenPayload.profile_url
      if ((userData.profile === null
         || userData.profile === undefined)
        && profileURL !== undefined && profileURL !== null) {
        return fetch(profileURL)
          .then((response) => {
            if (!response.ok) { // return blank profile if we fail to fetch
              userData.profile = Object.assign({}, DEFAULT_PROFILE)
              window.localStorage.setItem(
                BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData)
              )
              return userData
            } else {
              return response.text()
                .then(responseText => JSON.parse(responseText))
                .then(wrappedProfile => extractProfile(wrappedProfile[0].token))
                .then((profile) => {
                  userData.profile = profile
                  window.localStorage.setItem(
                    BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData)
                  )
                  return userData
                })
            }
          })
      } else {
        userData.profile = tokenPayload.profile
        window.localStorage.setItem(
          BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData)
        )
        return userData
      }
    })
}

/**
 * Retrieves the user data object. The user's profile is stored in the key `profile`.
 * @return {Object} User data object.
 */
export function loadUserData() {
  return JSON.parse(window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
}

/**
 * Sign the user out and optionally redirect to given location.
 * @param  {String} [redirectURL=null] Location to redirect user to after sign out.
 * @return {void}
 */
export function signUserOut(redirectURL: ?string = null) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.localStorage.removeItem(BLOCKSTACK_GAIA_HUB_LABEL)

  if (redirectURL !== null) {
    window.location = redirectURL
  }
}
