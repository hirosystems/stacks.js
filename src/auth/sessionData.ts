
import { GaiaHubConfig } from '../storage/hub'
import { InvalidStateError } from '../errors'
import { UserData } from './authApp'

const SESSION_VERSION = '1.0.0'

export interface SessionOptions {
  coreNode?: string,
  userData?: UserData,
  transitKey?: string,
  localStorageKey?: string,
  storeOptions?: {
    localStorageKey?: string
  }
}

/**
 * @ignore
 */
export class SessionData {
  version: string

  transitKey?: string

  // using this in place of
  // window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
  userData?: UserData

  constructor(options: SessionOptions) {
    this.version = SESSION_VERSION
    this.userData = options.userData
    this.transitKey = options.transitKey
  }

  getGaiaHubConfig(): GaiaHubConfig {
    return this.userData && this.userData.gaiaHubConfig
  }

  setGaiaHubConfig(config: GaiaHubConfig): void {
    this.userData.gaiaHubConfig = config
  }

  static fromJSON(json: any): SessionData {
    if (json.version !== SESSION_VERSION) {
      throw new InvalidStateError(`JSON data version ${json.version} not supported by SessionData`)
    }
    const options: SessionOptions = {
      coreNode: json.coreNode,
      userData: json.userData,
      transitKey: json.transitKey
    }
    return new SessionData(options)
  }

  toString(): string {
    return JSON.stringify(this)
  }
}
