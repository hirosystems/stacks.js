
import { GaiaHubConfig } from '../storage/hub'
import { InvalidStateError } from '../errors'
import { UserData } from './authApp'

const SESSION_VERSION = '1.0.0'

export interface SessionOptions {
  appPrivateKey?: string,
  username?: string,
  identityAddress?: string,
  coreNode?: string,
  hubUrl?: string,
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

  appPrivateKey?: string // required after sign in

  identityAddress?: string // required after sign in

  username?: string

  coreNode?: string

  hubUrl?: string // required after sign in

  transitKey?: string

  // using this in place of
  // window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
  userData?: UserData

  constructor(options: SessionOptions) {
    this.version = SESSION_VERSION
    this.appPrivateKey = options.appPrivateKey
    this.identityAddress = options.identityAddress
    this.username = options.username
    this.coreNode = options.coreNode
    this.hubUrl = options.hubUrl
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
      appPrivateKey: json.appPrivateKey,
      identityAddress: json.identityAddress,
      username: json.username,
      coreNode: json.coreNode,
      hubUrl: json.hubUrl,
      userData: json.userData,
      transitKey: json.transitKey
    }
    return new SessionData(options)
  }

  toString(): string {
    return JSON.stringify(this)
  }
}
