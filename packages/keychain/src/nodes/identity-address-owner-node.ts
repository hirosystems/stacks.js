import { BIP32Interface } from 'bitcoinjs-lib';
import { publicKeyToAddress, hashSha256Sync, hashCode } from '@stacks/encryption';
import { getAddress } from '../utils';
import bip32 from 'bip32';

const APPS_NODE_INDEX = 0;
const SIGNING_NODE_INDEX = 1;
const ENCRYPTION_NODE_INDEX = 2;
const STX_NODE_INDEX = 6;

export default class IdentityAddressOwnerNode {
  hdNode: BIP32Interface;

  salt: string;

  constructor(ownerHdNode: BIP32Interface, salt: string) {
    this.hdNode = ownerHdNode;
    this.salt = salt;
  }

  getNode() {
    return this.hdNode;
  }

  getSalt() {
    return this.salt;
  }

  getIdentityKey() {
    if (!this.hdNode.privateKey) {
      throw new Error('Node does not have private key');
    }
    return this.hdNode.privateKey.toString('hex');
  }

  getIdentityKeyID() {
    return this.hdNode.publicKey.toString('hex');
  }

  getAppsNode() {
    return this.hdNode.deriveHardened(APPS_NODE_INDEX);
  }

  getAddress() {
    return getAddress(this.hdNode);
  }

  getEncryptionNode() {
    return this.hdNode.deriveHardened(ENCRYPTION_NODE_INDEX);
  }

  getSigningNode() {
    return this.hdNode.deriveHardened(SIGNING_NODE_INDEX);
  }

  getSTXNode() {
    return this.hdNode.deriveHardened(STX_NODE_INDEX);
  }

  getAppNode(appDomain: string) {
    const hashBuffer = hashSha256Sync(Buffer.from(`${appDomain}${this.salt}`));
    const hash = hashBuffer.toString('hex');
    const appIndex = hashCode(hash);
    const appNodeInstance =
      typeof this.hdNode === 'string' ? bip32.fromBase58(this.hdNode) : this.hdNode;
    return appNodeInstance.deriveHardened(appIndex);
  }

  getAppPrivateKey(appDomain: string) {
    const appNode = this.getAppNode(appDomain);
    if (!appNode.privateKey) {
      throw new Error('App node does not have private key');
    }
    return appNode.privateKey.toString('hex');
  }

  getAppAddress(appDomain: string) {
    const appNode = this.getAppNode(appDomain);
    return publicKeyToAddress(appNode.publicKey);
  }
}
