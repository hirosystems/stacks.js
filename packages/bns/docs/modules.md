# Stacks.js Library Reference

## Table of contents

### Enumerations

- [BnsContractAddress](enums/bnscontractaddress.md)

### Interfaces

- [BnsContractCallOptions](interfaces/bnscontractcalloptions.md)
- [BnsReadOnlyOptions](interfaces/bnsreadonlyoptions.md)
- [CanRegisterNameOptions](interfaces/canregisternameoptions.md)
- [GetNamePriceOptions](interfaces/getnamepriceoptions.md)
- [GetNamespacePriceOptions](interfaces/getnamespacepriceoptions.md)
- [ImportNameOptions](interfaces/importnameoptions.md)
- [PreorderNameOptions](interfaces/preordernameoptions.md)
- [PreorderNamespaceOptions](interfaces/preordernamespaceoptions.md)
- [PriceFunction](interfaces/pricefunction.md)
- [ReadyNamespaceOptions](interfaces/readynamespaceoptions.md)
- [RegisterNameOptions](interfaces/registernameoptions.md)
- [RenewNameOptions](interfaces/renewnameoptions.md)
- [RevealNamespaceOptions](interfaces/revealnamespaceoptions.md)
- [RevokeNameOptions](interfaces/revokenameoptions.md)
- [TransferNameOptions](interfaces/transfernameoptions.md)
- [UpdateNameOptions](interfaces/updatenameoptions.md)

### Variables

- [BNS\_CONTRACT\_NAME](modules.md#bns_contract_name)

### Functions

- [buildImportNameTx](modules.md#buildimportnametx)
- [buildPreorderNameTx](modules.md#buildpreordernametx)
- [buildPreorderNamespaceTx](modules.md#buildpreordernamespacetx)
- [buildReadyNamespaceTx](modules.md#buildreadynamespacetx)
- [buildRegisterNameTx](modules.md#buildregisternametx)
- [buildRenewNameTx](modules.md#buildrenewnametx)
- [buildRevealNamespaceTx](modules.md#buildrevealnamespacetx)
- [buildRevokeNameTx](modules.md#buildrevokenametx)
- [buildTransferNameTx](modules.md#buildtransfernametx)
- [buildUpdateNameTx](modules.md#buildupdatenametx)
- [canRegisterName](modules.md#canregistername)
- [getNamePrice](modules.md#getnameprice)
- [getNamespacePrice](modules.md#getnamespaceprice)

## Variables

### BNS\_CONTRACT\_NAME

• `Const` **BNS\_CONTRACT\_NAME**: *bns*= 'bns'

Defined in: [index.ts:27](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L27)

## Functions

### buildImportNameTx

▸ **buildImportNameTx**(`__namedParameters`: [*ImportNameOptions*](interfaces/importnameoptions.md)): *Promise*<StacksTransaction\>

Generates a namespace name import transaction.
An optional step in namespace registration.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*ImportNameOptions*](interfaces/importnameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:408](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L408)

___

### buildPreorderNameTx

▸ **buildPreorderNameTx**(`__namedParameters`: [*PreorderNameOptions*](interfaces/preordernameoptions.md)): *Promise*<StacksTransaction\>

Generates a name preorder transaction.
First step in registering a name. This transaction does not reveal the name that is
about to be registered. And it sets the amount of STX to be burned for the registration.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*PreorderNameOptions*](interfaces/preordernameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:501](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L501)

___

### buildPreorderNamespaceTx

▸ **buildPreorderNamespaceTx**(`__namedParameters`: [*PreorderNamespaceOptions*](interfaces/preordernamespaceoptions.md)): *Promise*<StacksTransaction\>

Generates a namespace preorder transaction.
First step in registering a namespace. This transaction does not reveal the namespace that is
about to be registered. And it sets the amount of STX to be burned for the registration.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*PreorderNamespaceOptions*](interfaces/preordernamespaceoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:285](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L285)

___

### buildReadyNamespaceTx

▸ **buildReadyNamespaceTx**(`__namedParameters`: [*ReadyNamespaceOptions*](interfaces/readynamespaceoptions.md)): *Promise*<StacksTransaction\>

Generates a ready namespace transaction.
Final step in namespace registration. This completes the namespace registration and
makes the namespace available for name registrations.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*ReadyNamespaceOptions*](interfaces/readynamespaceoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:457](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L457)

___

### buildRegisterNameTx

▸ **buildRegisterNameTx**(`__namedParameters`: [*RegisterNameOptions*](interfaces/registernameoptions.md)): *Promise*<StacksTransaction\>

Generates a name registration transaction.
Second and final step in registering a name.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RegisterNameOptions*](interfaces/registernameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:552](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L552)

___

### buildRenewNameTx

▸ **buildRenewNameTx**(`__namedParameters`: [*RenewNameOptions*](interfaces/renewnameoptions.md)): *Promise*<StacksTransaction\>

Generates a name renew transaction.
This renews a name registration.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RenewNameOptions*](interfaces/renewnameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:766](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L766)

___

### buildRevealNamespaceTx

▸ **buildRevealNamespaceTx**(`__namedParameters`: [*RevealNamespaceOptions*](interfaces/revealnamespaceoptions.md)): *Promise*<StacksTransaction\>

Generates a namespace reveal transaction.
Second step in registering a namespace.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RevealNamespaceOptions*](interfaces/revealnamespaceoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:335](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L335)

___

### buildRevokeNameTx

▸ **buildRevokeNameTx**(`__namedParameters`: [*RevokeNameOptions*](interfaces/revokenameoptions.md)): *Promise*<StacksTransaction\>

Generates a name revoke transaction.
This revokes a name registration.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RevokeNameOptions*](interfaces/revokenameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:717](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L717)

___

### buildTransferNameTx

▸ **buildTransferNameTx**(`__namedParameters`: [*TransferNameOptions*](interfaces/transfernameoptions.md)): *Promise*<StacksTransaction\>

Generates a name transfer transaction.
This changes the owner of the registered name.

Since the underlying NFT will be transferred,
you will be required to add a post-condition to this
transaction before broadcasting it.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*TransferNameOptions*](interfaces/transfernameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:661](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L661)

___

### buildUpdateNameTx

▸ **buildUpdateNameTx**(`__namedParameters`: [*UpdateNameOptions*](interfaces/updatenameoptions.md)): *Promise*<StacksTransaction\>

Generates a name update transaction.
This changes the zonefile for the registered name.

Resolves to the generated StacksTransaction

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*UpdateNameOptions*](interfaces/updatenameoptions.md) |

**Returns:** *Promise*<StacksTransaction\>

Defined in: [index.ts:607](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L607)

___

### canRegisterName

▸ **canRegisterName**(`__namedParameters`: [*CanRegisterNameOptions*](interfaces/canregisternameoptions.md)): *Promise*<boolean\>

Check if name can be registered

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*CanRegisterNameOptions*](interfaces/canregisternameoptions.md) |

**Returns:** *Promise*<boolean\>

that resolves to true if the operation succeeds

Defined in: [index.ts:122](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L122)

___

### getNamePrice

▸ **getNamePrice**(`__namedParameters`: [*GetNamePriceOptions*](interfaces/getnamepriceoptions.md)): *Promise*<BN\>

Get price of name registration in microstacks

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*GetNamePriceOptions*](interfaces/getnamepriceoptions.md) |

**Returns:** *Promise*<BN\>

that resolves to a BN object number of microstacks if the operation succeeds

Defined in: [index.ts:222](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L222)

___

### getNamespacePrice

▸ **getNamespacePrice**(`__namedParameters`: [*GetNamespacePriceOptions*](interfaces/getnamespacepriceoptions.md)): *Promise*<BN\>

Get price of namespace registration in microstacks

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*GetNamespacePriceOptions*](interfaces/getnamespacepriceoptions.md) |

**Returns:** *Promise*<BN\>

that resolves to a BN object number of microstacks if the operation succeeds

Defined in: [index.ts:171](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L171)
