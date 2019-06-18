import { getGlobalObjects, BLOCKSTACK_HANDLER } from '../utils'
import { Logger } from '../logger'

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
export function launchCustomProtocol(
  authRequest: string, 
  successCallback: () => void, 
  failCallback: () => void) {
  // Create a unique ID used for this protocol detection attempt.
  const echoReplyID = Math.random().toString(36).substr(2, 9)
  const echoReplyKeyPrefix = 'echo-reply-'
  const echoReplyKey = `${echoReplyKeyPrefix}${echoReplyID}`

  const { 
    localStorage, document, 
    setTimeout, clearTimeout, 
    addEventListener, removeEventListener 
  } = getGlobalObjects(
    ['localStorage', 'document', 'setTimeout', 'clearTimeout', 'addEventListener', 'removeEventListener'],
    { throwIfUnavailable: true, usageDesc: 'detectProtocolLaunch' }
  )

  // Use localStorage as a reliable cross-window communication method.
  // Create the storage entry to signal a protocol detection attempt for the
  // next browser window to check.
  localStorage.setItem(echoReplyKey, Date.now().toString())
  const cleanUpLocalStorage = () => {
    try {
      localStorage.removeItem(echoReplyKey)
      // Also clear out any stale echo-reply keys older than 1 hour.
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey && storageKey.startsWith(echoReplyKeyPrefix)) {
          const storageValue = localStorage.getItem(storageKey)
          if (storageValue === 'success' || (Date.now() - parseInt(storageValue, 10)) > 3600000) {
            localStorage.removeItem(storageKey)
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
      clearTimeout(redirectToWebAuthTimer)
      redirectToWebAuthTimer = 0
    }
  }
  const startWebAuthRedirectTimer = (timeout = detectionTimeout) => {
    cancelWebAuthRedirectTimer()
    redirectToWebAuthTimer = setTimeout(() => {
      if (redirectToWebAuthTimer) {
        cancelWebAuthRedirectTimer()
        let nextFunc: () => void
        if (localStorage.getItem(echoReplyKey) === 'success') {
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

  // Setting display:none on an element prevents them from being focused/blurred.
  // So we hide using 0 width/height/opacity, and set position:fixed so that the
  // page does not scroll when the element is focused. 
  const hiddenCssStyle = 'all: initial; position: fixed; top: 0; height: 0; width: 0; opacity: 0;'
  inputPromptTracker.style.cssText = hiddenCssStyle

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
        clearTimeout(redirectToWebAuthTimer)
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
  document.body.appendChild(inputPromptTracker)
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
  addEventListener('storage', function replyEventListener(event) {
    if (event.key === echoReplyKey && localStorage.getItem(echoReplyKey) === 'success') {
      // Custom protocol worked, cancel the web auth redirect timer.
      cancelWebAuthRedirectTimer()
      inputPromptTracker.removeEventListener('blur', inputBlurredFunc)
      Logger.info('Protocol echo reply detected from localStorage event.')
      // Clean up event listener and localStorage.
      removeEventListener('storage', replyEventListener)
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

  const iframeStyle = 'all: initial; display: none; position: fixed; top: 0; height: 0; width: 0; opacity: 0;'
  iframe.style.cssText = iframeStyle
  iframe.src = locationSrc
  document.body.appendChild(iframe)
}
