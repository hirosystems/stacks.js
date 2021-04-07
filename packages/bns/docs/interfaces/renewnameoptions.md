[Stacks.js 1.0.0-beta.13 Library Reference](../README.md) / [Exports](../modules.md) / RenewNameOptions

# Interface: RenewNameOptions

Renew name options

**`param`** the fully qualified name to renew including the
                                       namespace (myName.id)

**`param`** amount of STX to burn for the registration

**`param`** the private key to sign the transaction

**`param`** optionally choose a new owner address

**`param`** optionally update the zonefile hash

**`param`** the Stacks blockchain network to use

## Table of contents

### Properties

- [fullyQualifiedName](renewnameoptions.md#fullyqualifiedname)
- [network](renewnameoptions.md#network)
- [newOwnerAddress](renewnameoptions.md#newowneraddress)
- [publicKey](renewnameoptions.md#publickey)
- [stxToBurn](renewnameoptions.md#stxtoburn)
- [zonefile](renewnameoptions.md#zonefile)

## Properties

### fullyQualifiedName

• **fullyQualifiedName**: *string*

Defined in: [index.ts:748](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L748)

___

### network

• **network**: StacksNetwork

Defined in: [index.ts:751](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L751)

___

### newOwnerAddress

• `Optional` **newOwnerAddress**: *string*

Defined in: [index.ts:752](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L752)

___

### publicKey

• **publicKey**: *string*

Defined in: [index.ts:750](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L750)

___

### stxToBurn

• **stxToBurn**: *BN*

Defined in: [index.ts:749](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L749)

___

### zonefile

• `Optional` **zonefile**: *string*

Defined in: [index.ts:753](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L753)
