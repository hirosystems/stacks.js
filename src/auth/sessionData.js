/* @flow */
import { AppConfig } from './appConfig'
import type { GaiaHubConfig } from '../storage/hub'

const SESSION_VERSION = '1.0.0'

export type SessionOptions = {
  appPrivateKey?: string,
  username?: string,
  identityAddress?: string,
  coreNode?: string,
  hubUrl?: string,
  appConfig?: AppConfig
}

export class SessionData {
  version: string

  appPrivateKey: ?string // required after sign in

  identityAddress: ?string // required after sign in

  username: ?string

  coreNode: ?string

  hubUrl: ?string // required after sign in

  transitKey: ?string

  // using this in place of
  // window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
  userData: ?any


  /**
   * This holds the configuration settings for a web app-style
   * Blockstack app
   * @type {AppConfig}
   * @private
   */
  appConfig: ?AppConfig

  gaiaHubConfig: ?GaiaHubConfig

  constructor(options: SessionOptions) {
    this.version = SESSION_VERSION
    this.appPrivateKey = options.appPrivateKey
    this.identityAddress = options.identityAddress
    this.username = options.username
    this.coreNode = options.coreNode
    this.hubUrl = options.hubUrl
    this.appConfig = options.appConfig

    // initializing Gaia connection requires a network request
    // so we'll defer it until the first time it's needed
    this.gaiaHubConfig = null
  }

  getGaiaHubConfig() : ?GaiaHubConfig {
    return this.gaiaHubConfig
  }

  setGaiaHubConfig(config: GaiaHubConfig) : void {
    this.gaiaHubConfig = config
  }

  toJSON() : JSON {
    return JSON.parse(JSON.stringify(this))
  }

  toString(): string {
    return JSON.stringify(this)
  }
}
