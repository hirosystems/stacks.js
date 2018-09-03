/* @flow */
import { DEFAULT_CORE_NODE, DEFAULT_SCOPE } from './authConstants'

// modeled after what we have in Android
// https://github.com/blockstack/blockstack-android/blob/d70864acdc12f50bd90fb276853c523845e04e22/blockstack-sdk/src/main/java/org/blockstack/android/sdk/BlockstackConfig.kt#L14
export class AppConfig {
  appDomain: string

  scopes: Array<string>

  // this needs to be on appDomain so only accept paths
  redirectPath: string

  // this needs to be on appDomain so only accept paths
  manifestPath: string

  // if null, use node passed by auth token v1.3 or otherwise core.blockstack.org
  coreNode: string

  constructor(appDomain: string = window.location.origin,
              scopes: Array<string> = DEFAULT_SCOPE.slice(),
              redirectPath: string = '/',
              manifestPath: string = '/manifest.json',
              coreNode: ?string = null) {
    this.appDomain = appDomain
    this.scopes = scopes
    this.redirectPath = redirectPath
    this.manifestPath = manifestPath

    if (!coreNode) {
      this.coreNode = DEFAULT_CORE_NODE
    } else {
      this.coreNode = coreNode
    }
  }

  redirectURI() : string {
    return `${this.appDomain}${this.redirectPath}`
  }

  manifestURI() : string {
    return `${this.appDomain}${this.manifestPath}`
  }
}
