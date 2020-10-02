import { InvalidStateError } from '@stacks/common';
import { UserData } from './userData';

const SESSION_VERSION = '1.0.0';

type EtagMap = { [key: string]: string };

export interface SessionOptions {
  coreNode?: string;
  userData?: UserData;
  transitKey?: string;
  etags?: EtagMap;
  localStorageKey?: string;
  storeOptions?: {
    localStorageKey?: string;
  };
}

/**
 * @ignore
 */
export class SessionData {
  version: string;

  transitKey?: string;

  // using this in place of
  // window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
  userData?: UserData;

  etags?: EtagMap;

  constructor(options: SessionOptions) {
    this.version = SESSION_VERSION;
    this.userData = options.userData;
    this.transitKey = options.transitKey;
    this.etags = options.etags ? options.etags : {};
  }

  // getGaiaHubConfig(): GaiaHubConfig {
  //   return this.userData && this.userData.gaiaHubConfig
  // }

  // setGaiaHubConfig(config: GaiaHubConfig): void {
  //   this.userData.gaiaHubConfig = config
  // }

  static fromJSON(json: any): SessionData {
    if (json.version !== SESSION_VERSION) {
      throw new InvalidStateError(`JSON data version ${json.version} not supported by SessionData`);
    }
    const options: SessionOptions = {
      coreNode: json.coreNode,
      userData: json.userData,
      transitKey: json.transitKey,
      etags: json.etags,
    };
    return new SessionData(options);
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
