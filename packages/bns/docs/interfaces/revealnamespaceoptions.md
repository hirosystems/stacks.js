[Stacks.js 1.0.0-beta.13 Library Reference](../README.md) / [Exports](../modules.md) / RevealNamespaceOptions

# Interface: RevealNamespaceOptions

Reveal namespace options

**`param`** the namespace to reveal

**`param`** salt used to generate the preorder namespace hash

**`param`** an object containing the price function for the namespace

**`param`** the number of blocks name registrations are valid for in the namespace

**`param`** the STX address used for name imports

**`param`** the private key to sign the transaction

**`param`** the Stacks blockchain network to register on

## Table of contents

### Properties

- [lifetime](revealnamespaceoptions.md#lifetime)
- [namespace](revealnamespaceoptions.md#namespace)
- [namespaceImportAddress](revealnamespaceoptions.md#namespaceimportaddress)
- [network](revealnamespaceoptions.md#network)
- [priceFunction](revealnamespaceoptions.md#pricefunction)
- [privateKey](revealnamespaceoptions.md#privatekey)
- [salt](revealnamespaceoptions.md#salt)

## Properties

### lifetime

• **lifetime**: *BN*

Defined in: [index.ts:315](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L315)

___

### namespace

• **namespace**: *string*

Defined in: [index.ts:312](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L312)

___

### namespaceImportAddress

• **namespaceImportAddress**: *string*

Defined in: [index.ts:316](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L316)

___

### network

• `Optional` **network**: StacksNetwork

Defined in: [index.ts:318](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L318)

___

### priceFunction

• **priceFunction**: [*PriceFunction*](../modules.md#pricefunction)

Defined in: [index.ts:314](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L314)

___

### privateKey

• **privateKey**: *string*

Defined in: [index.ts:317](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L317)

___

### salt

• **salt**: *string*

Defined in: [index.ts:313](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L313)
