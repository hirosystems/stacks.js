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

/**
 * The BlockstackWallet class manages the hierarchical derivation
 *  paths for a standard blockstack client wallet. This includes paths
 *  for bitcoin payment address, blockstack identity addresses, blockstack
 *  application specific addresses.
 */
export class BlockstackWallet {
  rootNode: HDNode

  constructor(rootNode: HDNode) {
    this.rootNode = rootNode
  }

  /**
   * Initialize a blockstack wallet
   * @param {Buffer} seed - the input seed for initializing the root node
   *  of the hierarchical wallet
   * @return {BlockstackWallet} the constructed wallet
   */
  static fromSeedBuffer(seed: Buffer): BlockstackWallet {
    return new BlockstackWallet(HDNode.fromSeedBuffer(seed))
  }

  /**
   * Initialize a blockstack wallet
   * @param {string} keychain - the Base58 string used to initialize
   *  the root node of the hierarchical wallet
   * @return {BlockstackWallet} the constructed wallet
   */
  static fromBase58(keychain: string): BlockstackWallet {
    return new BlockstackWallet(HDNode.fromBase58(keychain))
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

  /**
   * Get a salt for use with creating application specific addresses
   * @return {String} the salt
   */
  getIdentitySalt(): string {
    const identityPrivateKeychain = this.getIdentityPrivateKeychain()
    const publicKeyHex = getNodePublicKey(identityPrivateKeychain)
    return crypto.createHash('sha256').update(publicKeyHex).digest('hex')
  }

  /**
   * Get a bitcoin receive address at a given index
   * @param {number} addressIndex - the index of the address
   * @return {String} address
   */
  getBitcoinAddress(addressIndex: number): string {
    return this.getBitcoinNode(addressIndex).getAddress()
  }

  /**
   * Get the private key hex-string for a given bitcoin receive address
   * @param {number} addressIndex - the index of the address
   * @return {String} the hex-string. this will be either 64
   * characters long to denote an uncompressed bitcoin address, or 66
   * characters long for a compressed bitcoin address.
   */
  getBitcoinPrivateKey(addressIndex: number): string {
    return getNodePrivateKey(this.getBitcoinNode(addressIndex))
  }

  /**
   * Get the root node for the bitcoin public keychain
   * @return {String} base58-encoding of the public node
   */
  getBitcoinPublicKeychain(): string {
    return this.getBitcoinPrivateKeychain().neutered().toBase58()
  }

  /**
   * Get the root node for the identity public keychain
   * @return {String} base58-encoding of the public node
   */
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

  /**
   * Get a bitcoin address given a base-58 encoded bitcoin node
   * (usually called the account node)
   * @param {String} keychainBase58 - base58-encoding of the node
   * @param {number} addressIndex - index of the address to get
   * @param {String} chainType - either 'EXTERNAL_ADDRESS' (for a
   * "receive" address) or 'CHANGE_ADDRESS'
   * @return {String} the address
   */
  static getAddressFromBitcoinKeychain(keychainBase58: string, addressIndex: number,
                                       chainType: string = EXTERNAL_ADDRESS): string {
    return BlockstackWallet
      .getNodeFromBitcoinKeychain(keychainBase58, addressIndex, chainType)
      .getAddress()
  }

  /**
   * Get a ECDSA private key hex-string for an application-specific
   *  address.
   * @param {String} appsNodeKey - the base58-encoded private key for
   * applications node (the `appsNodeKey` return in getIdentityKeyPair())
   * @param {String} salt - a string, used to salt the
   * application-specific addresses
   * @param {String} appDomain - the appDomain to generate a key for
   * @return {String} the private key hex-string. this will be a 64
   * character string
   */
  static getAppPrivateKey(appsNodeKey: string, salt: string, appDomain: string): string {
    const hash = crypto
          .createHash('sha256')
          .update(`${appDomain}${salt}`)
          .digest('hex')
    const appIndex = hashCode(hash)
    const appNode = HDNode.fromBase58(appsNodeKey).deriveHardened(appIndex)
    return getNodePrivateKey(appNode).slice(0, 64)
  }

  /**
   * Get the keypair information for a given identity index. This
   * information is used to obtain the private key for an identity address
   * and derive application specific keys for that address.
   * @param {number} addressIndex - the identity index
   * @param {boolean} alwaysUncompressed - if true, always return a
   *   private-key hex string corresponding to the uncompressed address
   * @return {Object} an IdentityKeyPair type object with keys:
   *   .key {String} - the private key hex-string
   *   .keyID {String} - the public key hex-string
   *   .address {String} - the identity address
   *   .appsNodeKey {String} - the base-58 encoding of the applications node
   *   .salt {String} - the salt used for creating app-specific addresses
   */
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
