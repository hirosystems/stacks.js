/* @flow */
import { AppConfig } from './auth/appConfig'
import type { GaiaHubConfig } from './storage/hub'

const SESSION_VERSION = '1.0.0'

type BlockstackSessionOptions = {
  appPrivateKey: ?string,
  username: string,
  identityAddress: string,
  coreNode: ?string,
  hubUrl: string,
  appConfig: ?AppConfig
}

export class BlockstackSession {
  version: string

  appPrivateKey: ?string

  identityAddress: ?string

  username: ?string

  coreNode: ?string

  hubUrl: ?string

  transitKey: ?string

  identityAddress: ?string


  /**
   * This holds the configuration settings for a web app-style
   * Blockstack app
   * @type {AppConfig}
   */
  appConfig: ?AppConfig

  gaiaHubConfig: ?GaiaHubConfig

  constructor(options: BlockstackSessionOptions) {
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
