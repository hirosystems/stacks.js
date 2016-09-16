'use strict'

import KeyEncoder from 'key-encoder'
import { TokenSigner, decodeToken } from 'jwt-js'
import { secp256k1 } from 'elliptic-curve'
import uuid from 'node-uuid'

export class AuthResponse {
    constructor(privateKey) {
        this.privateKey = privateKey
        this.keyEncoder = new KeyEncoder('secp256k1')
        this.publicKey = secp256k1.getPublicKey(privateKey)
        this.tokenSigner = new TokenSigner('ES256k', privateKey)
        this.issuer = { publicKey: this.publicKey }
    }

    satisfyProvisions(provisions, username, privateData) {
        provisions.forEach((provision) => {
            switch(provision.action) {
                case 'disclose':
                    if (provision.scope === 'username' && username) {
                        provision.data = username
                    }
                    break;
                case 'sign':
                    if (provision.data) {
                        const signature = secp256k1.signMessage(
                            provision.data, this.privateKey)
                        provision.signature = signature
                    }
                    break;
                case 'write':
                    break;
                default:
                    break;
            }
        })

        this.provisions = provisions
    }

    setIssuer(username, publicKeychain, chainPath) {
        if (username && publicKeychain && chainPath) {
            this.issuer = {
                publicKey: this.publicKey,
                username: username,
                publicKeychain: publicKeychain,
                chainPath: chainPath
            }
        } else if (username) {
            this.issuer = {
                publicKey: this.publicKey,
                username: username
            }
        } else if (username || publicKeychain || chainPath) {
            throw 'Either all or none of the following must be provided: username, publicKeychain, chainPath'
        } else {
            throw 'Cannot set issuer without the following: username, publicKeychain, chainPath'
        }
    }

    payload() {
        return {
            issuer: this.issuer,
            issuedAt: new Date().getTime(),
            provisions: this.provisions
        }
    }

    sign() {
        return this.tokenSigner.sign(this.payload())
    }
}
