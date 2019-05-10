/**
 * This logic is in a separate file with no dependencies so that it can be 
 * loaded and executed as soon as possible to fulfill the purpose of the protocol 
 * detection technique. The effectiveness of this is obviously subject to how web 
 * apps bundle/consume the blockstack.js lib. 
 */ 

const GLOBAL_DETECTION_CACHE_KEY = '_blockstackDidCheckEchoReply'
const ECHO_REPLY_PARAM = 'echoReply'
const AUTH_CONTINUATION_PARAM = 'authContinuation'

/**
 * Checks if the current window location URL contains an 'echoReply' parameter 
 * which indicates that this page was only opened to signal back to the originating 
 * tab that the protocol handler is installed. 
 * If found, then localStorage events are used to notify the other tab,
 * and this page is redirected back to the Blockstack authenticator URL. 
 * This function caches its result and will not trigger multiple redirects when
 * invoked multiple times. 
 * @returns True if detected and the page will be automatically redirected. 
 * @hidden
 */
export function protocolEchoReplyDetection(): boolean {
  // Check that the `window` APIs exist
  if (typeof window !== 'object' || !window.location || !window.localStorage) {
    // Exit detection function - we are not running in a browser environment.
    return false
  }

  // Avoid performing the check twice and triggered multiple redirect timers.
  const existingDetection = (window as any)[GLOBAL_DETECTION_CACHE_KEY]
  if (typeof existingDetection === 'boolean') {
    return existingDetection
  }

  const searchParams = new window.URLSearchParams(window.location.search)
  const echoReplyParam = searchParams.get(ECHO_REPLY_PARAM)
  if (echoReplyParam) {
    (window as any)[GLOBAL_DETECTION_CACHE_KEY] = true

    // Use localStorage to notify originated tab that protocol handler is available and working.
    const echoReplyKey = `echo-reply-${echoReplyParam}`

    // Set the echo-reply result in localStorage for the other window to see.
    window.localStorage.setItem(echoReplyKey, 'success')

    // Redirect back to the localhost auth url, as opposed to another protocol launch.
    // This will re-use the same tab rather than creating another useless one.
    window.setTimeout(() => {
      const authContinuationParam = searchParams.get(AUTH_CONTINUATION_PARAM)
      window.location.href = authContinuationParam
    }, 10)

    return true
  }

  return false
}
