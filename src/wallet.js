/* @flow */
import { HDNode } from 'bitcoinjs-lib'
import { ecPairToHexString } from './utils'
import crypto from 'crypto'

const APPS_NODE_INDEX = 0
const IDENTITY_KEYCHAIN = 888
const BLOCKSTACK_ON_BITCOIN = 0

const BITCOIN_BIP_44_PURPOSE = 44
const BITCOIN_COIN_TYPE = 0
const BITCOIN_ACCOUNT_INDEX = 0

const EXTERNAL_ADDRESS = 'EXTERNAL_ADDRESS'
const CHANGE_ADDRESS = 'CHANGE_ADDRESS'

export type IdentityKeyPair = {
  key: string,
  keyID: string,
  address: string,
  appsNodeKey: string,
  salt: string
}

function hashCode(string) {
  let hash = 0
  if (string.length === 0) return hash
  for (let i = 0; i < string.length; i++) {
    const character = string.charCodeAt(i)
    hash = (hash << 5) - hash + character
    hash = hash & hash
  }
  return hash & 0x7fffffff
}

function getNodePrivateKey(hdNode): string {
  return ecPairToHexString(hdNode.keyPair)
}

function getNodePublicKey(hdNode): string {
  return hdNode.keyPair.getPublicKeyBuffer().toString('hex')
}

export class BlockstackWallet {
  rootNode: HDNode

  constructor(seed: Buffer) {
    this.rootNode = HDNode.fromSeedBuffer(seed)
  }


  getIdentityPrivateKeychain(): HDNode {
    return this.rootNode
      .deriveHardened(IDENTITY_KEYCHAIN)
      .deriveHardened(BLOCKSTACK_ON_BITCOIN)
  }

  getBitcoinPrivateKeychain(): HDNode {
    return this.rootNode
      .deriveHardened(BITCOIN_BIP_44_PURPOSE)
      .deriveHardened(BITCOIN_COIN_TYPE)
      .deriveHardened(BITCOIN_ACCOUNT_INDEX)
  }

  getBitcoinNode(addressIndex: number, chainType: string = EXTERNAL_ADDRESS): HDNode {
    return BlockstackWallet.getNodeFromBitcoinKeychain(
      this.getBitcoinPrivateKeychain().toBase58(),
      addressIndex, chainType)
  }

  getIdentityAddressNode(identityIndex: number): HDNode {
    const identityPrivateKeychain = this.getIdentityPrivateKeychain()
    return identityPrivateKeychain.deriveHardened(identityIndex)
  }

  static getAppsNode(identityNode: HDNode): HDNode {
    return identityNode.deriveHardened(APPS_NODE_INDEX)
  }

  getIdentitySalt(): string {
    const identityPrivateKeychain = this.getIdentityPrivateKeychain()
    const publicKeyHex = getNodePublicKey(identityPrivateKeychain)
    return crypto.createHash('sha256').update(publicKeyHex).digest('hex')
  }

  getBitcoinAddress(addressIndex: number): string {
    return this.getBitcoinNode(addressIndex).getAddress()
  }

  getBitcoinPrivateKey(addressIndex: number): string {
    return getNodePrivateKey(this.getBitcoinNode(addressIndex))
  }

  getBitcoinPublicKeychain(): string {
    return this.getBitcoinPrivateKeychain().neutered().toBase58()
  }

  getIdentityPublicKeychain(): string {
    return this.getIdentityPrivateKeychain().neutered().toBase58()
  }

  static getNodeFromBitcoinKeychain(keychainBase58: string, addressIndex: number,
                                    chainType: string = EXTERNAL_ADDRESS): HDNode {
    let chain
    if (chainType === EXTERNAL_ADDRESS) {
      chain = 0
    } else if (chainType === CHANGE_ADDRESS) {
      chain = 1
    } else {
      throw new Error('Invalid chain type')
    }
    const keychain = HDNode.fromBase58(keychainBase58)

    return keychain.derive(chain).derive(addressIndex)
  }

  static getAddressFromBitcoinKeychain(keychainBase58: string, addressIndex: number,
                                       chainType: string = EXTERNAL_ADDRESS): string {
    return BlockstackWallet
      .getNodeFromBitcoinKeychain(keychainBase58, addressIndex, chainType)
      .getAddress()
  }

  static getAppPrivateKey(appsNodeKey: string, salt: string, appDomain: string): string {
    const hash = crypto
          .createHash('sha256')
          .update(`${appDomain}${salt}`)
          .digest('hex')
    const appIndex = hashCode(hash)
    const appNode = HDNode.fromBase58(appsNodeKey).deriveHardened(appIndex)
    return getNodePrivateKey(appNode).slice(0, 64)
  }

  getIdentityKeyPair(addressIndex: number, alwaysUncompressed: ?boolean = false): IdentityKeyPair {
    const identityNode = this.getIdentityAddressNode(addressIndex)

    const address = identityNode.getAddress()
    let identityKey = getNodePrivateKey(identityNode)
    if (alwaysUncompressed && identityKey.length === 66) {
      identityKey = identityKey.slice(0, 64)
    }

    const identityKeyID = getNodePublicKey(identityNode)
    const appsNodeKey = BlockstackWallet.getAppsNode(identityNode).toBase58()
    const salt = this.getIdentitySalt()
    const keyPair = {
      key: identityKey,
      keyID: identityKeyID,
      address, appsNodeKey, salt
    }
    return keyPair
  }
}
