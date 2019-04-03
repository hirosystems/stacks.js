
import { SessionData, SessionOptions } from './sessionData'
// import { BLOCKSTACK_GAIA_HUB_LABEL } from '../storage/hub'
import {
  LOCALSTORAGE_SESSION_KEY
} from './authConstants'
import { NoSessionDataError } from '../errors'
// import { Logger } from '../logger'

/**
 * An abstract class representing the SessionDataStore interface.

 */
export class SessionDataStore {
  constructor(sessionOptions?: SessionOptions) {
    if (sessionOptions) {
      const newSessionData = new SessionData(sessionOptions)
      this.setSessionData(newSessionData)
    }
  }

  getSessionData(): SessionData {
    throw new Error('Abstract class')
  }

  /* eslint-disable */
  setSessionData(session: SessionData): boolean {
    throw new Error('Abstract class')
  }

  deleteSessionData(): boolean {
    throw new Error('Abstract class')
  }
  /* eslint-enable */
}

/**
 * Stores session data in the instance of this class.
 * @ignore
 */
export class InstanceDataStore extends SessionDataStore {
  sessionData?: SessionData

  constructor(sessionOptions?: SessionOptions) {
    super(sessionOptions)
    if (!this.sessionData) {
      this.setSessionData(new SessionData({}))
    }
  }


  getSessionData(): SessionData {
    if (!this.sessionData) {
      throw new NoSessionDataError('No session data was found.')
    }
    return this.sessionData
  }

  setSessionData(session: SessionData): boolean {
    this.sessionData = session
    return true
  }

  deleteSessionData(): boolean {
    this.setSessionData(new SessionData({}))
    return true
  }
}

/**
 * Stores session data in browser a localStorage entry.
 * @ignore
 */
export class LocalStorageStore extends SessionDataStore {
  key: string

  constructor(sessionOptions?: SessionOptions) {
    super(sessionOptions)
    if (sessionOptions
      && sessionOptions.storeOptions
      && sessionOptions.storeOptions.localStorageKey
      && (typeof sessionOptions.storeOptions.localStorageKey === 'string')) {
      this.key = sessionOptions.storeOptions.localStorageKey
    } else {
      this.key = LOCALSTORAGE_SESSION_KEY
    }

    const data = localStorage.getItem(this.key)
    if (!data) {
      const sessionData = new SessionData({})
      this.setSessionData(sessionData)
    }
  }

  getSessionData(): SessionData {
    const data = localStorage.getItem(this.key)
    if (!data) {
      throw new NoSessionDataError('No session data was found in localStorage')
    }
    const dataJSON = JSON.parse(data)
    return SessionData.fromJSON(dataJSON)
  }

  setSessionData(session: SessionData): boolean {
    localStorage.setItem(this.key, session.toString())
    return true
  }

  deleteSessionData(): boolean {
    localStorage.removeItem(this.key)
    this.setSessionData(new SessionData({}))
    return true
  }

  // checkForLegacyDataAndMigrate(): Promise<SessionData> {
  //   const legacyTransitKey = localStorage.getItem(BLOCKSTACK_APP_PRIVATE_KEY_LABEL)
  //   const legacyGaiaConfig = localStorage.getItem(BLOCKSTACK_GAIA_HUB_LABEL)
  //   const legacyUserData = localStorage.getItem(BLOCKSTACK_STORAGE_LABEL)
  //
  //
  //   if (legacyTransitKey) {
  //     localStorage.removeItem(BLOCKSTACK_APP_PRIVATE_KEY_LABEL)
  //   }
  //
  //
  //
  // }
}
