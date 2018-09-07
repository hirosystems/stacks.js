/* @flow */
import { SessionData } from './sessionData'
import type { SessionOptions } from './sessionData'
// import { BLOCKSTACK_GAIA_HUB_LABEL } from '../storage/hub'
import {
  LOCALSTORAGE_SESSION_KEY
} from './authConstants'
import { NoSessionDataError } from '../errors'

export class SessionDataStore {
  constructor(sessionOptions?: SessionOptions) {
    if (sessionOptions) {
      const newSessionData = new SessionData(sessionOptions)
      this.setSessionData(newSessionData)
    }
  }

  getSessionData(): Promise<SessionData> {
    throw new Error('Abstract class')
  }

  /* eslint-disable */
  setSessionData(session: SessionData): Promise<boolean> {
    throw new Error('Abstract class')
  }

  deleteSessionData(): Promise<boolean> {
    throw new Error('Abstract class')
  }
  /* eslint-enable */
}

export class InstanceDataStore {
  sessionData: ?SessionData

  getSessionData(): Promise<SessionData> {
    if (!this.sessionData) {
      throw new NoSessionDataError('No session data was found.')
    }
    return Promise.resolve(this.sessionData)
  }

  setSessionData(session: SessionData): Promise<boolean> {
    this.sessionData = session
    return Promise.resolve(true)
  }

  deleteSessionData(): Promise<boolean> {
    this.sessionData = null
    return Promise.resolve(true)
  }
}

export class LocalStorageStore extends SessionDataStore {
  key: string

  constructor(key: string = LOCALSTORAGE_SESSION_KEY,
              sessionOptions?: SessionOptions) {
    super(sessionOptions)
    this.key = key
    const data = localStorage.getItem(this.key)
    if (!data) {
      const sessionData = new SessionData({})
      this.setSessionData(sessionData)
    }
  }

  getSessionData(): Promise<SessionData> {
    const data = localStorage.getItem(this.key)
    if (!data) {
      throw new NoSessionDataError('No session data was found in localStorage')
    }
    const dataJSON = JSON.parse(data)
    return Promise.resolve(SessionData.fromJSON(dataJSON))
  }

  setSessionData(session: SessionData): Promise<boolean> {
    localStorage.setItem(this.key, session.toString())
    return Promise.resolve(true)
  }

  deleteSessionData(): Promise<boolean> {
    localStorage.removeItem(this.key)
    return Promise.resolve(true)
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
