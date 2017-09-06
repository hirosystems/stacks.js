// derived from blockstack-browser/app/js/utils/account-utils.js

import crypto from 'crypto'

const APPS_NODE_INDEX = 0
const SIGNING_NODE_INDEX = 1
const ENCRYPTION_NODE_INDEX = 2

const IDENTITY_KEYCHAIN = 888
const BLOCKSTACK_ON_BITCOIN = 0

const EXTERNAL_ADDRESS = 'EXTERNAL_ADDRESS'
const CHANGE_ADDRESS = 'CHANGE_ADDRESS'

/*
 * Calculate a 31-bit hash code for a particular string
 * (i.e. a domain name or app blockchain ID).
 * Used to deterministically derive app-specific keys, given the app name,
 * with a low chance of collision.
 */
function hashCode(string) {
  let hash = 0
  if (string.length === 0) return hash
  for (let i = 0; i < string.length; i++) {
    const character = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + character
    hash = hash & hash
  }
  return hash & 0x7fffffff
}


/*
 * Hardened private key deriviation node in the user's wallet,
 * meant for generating application-specific keys.
 */
export class AppNode {
  constructor(hdNode, appDomain) {
    this.hdNode = hdNode
    this.appDomain = appDomain
  }

  getAppPrivateKey() {
    return this.hdNode.keyPair.d.toBuffer(32).toString('hex')
  }

  getAddress() {
    return this.hdNode.getAddress()
  }
}


/*
 * Hardened private key derivation node in the user's wallet,
 * meant for holding all of the user's app keys.
 */
export class AppsNode {
  constructor(appsHdNode, salt) {
    this.hdNode = appsHdNode
    this.salt = salt
  }

  getNode() {
    return this.hdNode
  }

  getAppNode(appDomain) {
    const hash = crypto.createHash('sha256').update(`${appDomain}${this.salt}`).digest('hex')
    const appIndex = hashCode(hash)
    const appNode = this.hdNode.deriveHardened(appIndex)
    return new AppNode(appNode, appDomain)
  }

  toBase58() {
    return this.hdNode.toBase58()
  }

  getSalt() {
    return this.salt
  }
}


/*
 * Hardened private key derivation node in the user's wallet,
 * meant for deriving keys to own names.
 */
export class IdentityAddressOwnerNode {
  constructor(ownerHdNode, salt) {
    this.hdNode = ownerHdNode
    this.salt = salt
  }

  getNode() {
    return this.hdNode
  }

  getSalt() {
    return this.salt
  }

  getIdentityKey() {
    return this.hdNode.keyPair.d.toBuffer(32).toString('hex')
  }

  getIdentityKeyID() {
    return this.hdNode.keyPair.getPublicKeyBuffer().toString('hex')
  }

  getAppsNode() {
    return new AppsNode(this.hdNode.deriveHardened(APPS_NODE_INDEX), this.salt)
  }

  getAddress() {
    return this.hdNode.getAddress()
  }

  getEncryptionNode() {
    return this.hdNode.deriveHardened(ENCRYPTION_NODE_INDEX)
  }

  getSigningNode() {
    return this.hdNode.deriveHardened(SIGNING_NODE_INDEX)
  }
}


/*
 * Given the master keychain to a user's wallet, return the
 * hardened child that will be used to derive account keys.
 */
export function getBitcoinPrivateKeychain(masterKeychain) {
  const BIP_44_PURPOSE = 44
  const BITCOIN_COIN_TYPE = 0
  const ACCOUNT_INDEX = 0

  return masterKeychain.deriveHardened(BIP_44_PURPOSE)
  .deriveHardened(BITCOIN_COIN_TYPE)
  .deriveHardened(ACCOUNT_INDEX)
}


/*
 * Given the bitcoin private keychain, derive the *unhardened* node for calculating
 * the external and/or change key/address pairs.
 */
export function getBitcoinAddressNode(bitcoinKeychain,
                                      addressIndex = 0,
                                      chainType = EXTERNAL_ADDRESS) {
  let chain = null

  if (chainType === EXTERNAL_ADDRESS) {
    chain = 0
  } else if (chainType === CHANGE_ADDRESS) {
    chain = 1
  } else {
    throw new Error('Invalid chain type')
  }

  return bitcoinKeychain.derive(chain).derive(addressIndex)
}


/*
 * Given the master keychain, derive the hardened ndoe that will be used
 * to derive name-owning keys on the Bitcoin blockchain.
 */
export function getIdentityPrivateKeychain(masterKeychain) {
  return masterKeychain.deriveHardened(IDENTITY_KEYCHAIN)
  .deriveHardened(BLOCKSTACK_ON_BITCOIN)
}


/*
 * Given the identity private keychain, derive the next key to own the next name
 * (controlled by @identityIndex)
 */
export function getIdentityOwnerAddressNode(identityPrivateKeychain, identityIndex = 0) {
  if (identityPrivateKeychain.isNeutered()) {
    throw new Error('You need the private key to generate identity addresses')
  }

  const publicKeyHex = identityPrivateKeychain.keyPair.getPublicKeyBuffer().toString('hex')
  const salt = crypto.createHash('sha256').update(publicKeyHex).digest('hex')

  return new IdentityAddressOwnerNode(identityPrivateKeychain.deriveHardened(identityIndex), salt)
}


/*
 * Given an identity key node, get the actual private key, address, salt, and application node.
 */
export function deriveIdentityKeyPair(identityOwnerAddressNode) {
  const address = identityOwnerAddressNode.getAddress()
  const identityKey = identityOwnerAddressNode.getIdentityKey()
  const identityKeyID = identityOwnerAddressNode.getIdentityKeyID()
  const appsNode = identityOwnerAddressNode.getAppsNode()
  const keyPair = {
    node: identityOwnerAddressNode.getNode(),
    key: identityKey,
    keyID: identityKeyID,
    address,
    appsNodeKey: appsNode.toBase58(),
    salt: appsNode.getSalt()
  }
  return keyPair
}


/*
 * Given a list of name addresses, and a specific address, find the index
 * at which it occurs.
 */
export function findAddressIndex(address, identityAddresses) {
  for (let i = 0; i < identityAddresses.length; i++) {
    if (identityAddresses[i] === address) {
      return i
    }
  }
  return null
}

