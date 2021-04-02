[Stacks.js 1.0.0-beta.13 Library Reference](../README.md) / [Exports](../modules.md) / RenewNameOptions

# Interface: RenewNameOptions

Renew name options

**`param`** the fully qualified name to renew including the
                                       namespace (myName.id)

**`param`** amount of STX to burn for the registration

**`param`** the private key to sign the transaction

**`param`** optionally choose a new owner address

**`param`** optionally update the zonefile hash

**`param`** the Stacks blockchain network to register on

## Table of contents

### Properties

- [fullyQualifiedName](renewnameoptions.md#fullyqualifiedname)
- [network](renewnameoptions.md#network)
- [newOwnerAddress](renewnameoptions.md#newowneraddress)
- [privateKey](renewnameoptions.md#privatekey)
- [stxToBurn](renewnameoptions.md#stxtoburn)
- [zonefile](renewnameoptions.md#zonefile)

## Properties

### fullyQualifiedName

• **fullyQualifiedName**: *string*

Defined in: [index.ts:760](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L760)

___

### network

• `Optional` **network**: StacksNetwork

Defined in: [index.ts:765](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L765)

___

### newOwnerAddress

• `Optional` **newOwnerAddress**: *string*

Defined in: [index.ts:763](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L763)

___

### privateKey

• **privateKey**: *string*

Defined in: [index.ts:762](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L762)

___

### stxToBurn

• **stxToBurn**: *BN*

Defined in: [index.ts:761](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L761)

___

### zonefile

• `Optional` **zonefile**: *string*

Defined in: [index.ts:764](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L764)
