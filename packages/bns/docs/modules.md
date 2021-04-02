# Stacks.js BNS Library Reference

## Table of contents

### Interfaces

- [BNSContractCallOptions](interfaces/bnscontractcalloptions.md)
- [BNSReadOnlyOptions](interfaces/bnsreadonlyoptions.md)
- [ImportNameOptions](interfaces/importnameoptions.md)
- [PreorderNameOptions](interfaces/preordernameoptions.md)
- [PreorderNamespaceOptions](interfaces/preordernamespaceoptions.md)
- [ReadyNamespaceOptions](interfaces/readynamespaceoptions.md)
- [RegisterNameOptions](interfaces/registernameoptions.md)
- [RenewNameOptions](interfaces/renewnameoptions.md)
- [RevealNamespaceOptions](interfaces/revealnamespaceoptions.md)
- [RevokeNameOptions](interfaces/revokenameoptions.md)
- [TransferNameOptions](interfaces/transfernameoptions.md)
- [UpdateNameOptions](interfaces/updatenameoptions.md)

### Type aliases

- [PriceFunction](modules.md#pricefunction)
- [Result](modules.md#result)

### Variables

- [BNS\_CONTRACT\_ADDRESS](modules.md#bns_contract_address)
- [BNS\_CONTRACT\_NAME](modules.md#bns_contract_name)

### Functions

- [canRegisterName](modules.md#canregistername)
- [getNamePrice](modules.md#getnameprice)
- [getNamespacePrice](modules.md#getnamespaceprice)
- [importName](modules.md#importname)
- [preorderName](modules.md#preordername)
- [preorderNamespace](modules.md#preordernamespace)
- [readyNamespace](modules.md#readynamespace)
- [registerName](modules.md#registername)
- [renewName](modules.md#renewname)
- [revealNamespace](modules.md#revealnamespace)
- [revokeName](modules.md#revokename)
- [transferName](modules.md#transfername)
- [updateName](modules.md#updatename)

## Type aliases

### PriceFunction

Ƭ **PriceFunction**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`b1` | BN |
`b10` | BN |
`b11` | BN |
`b12` | BN |
`b13` | BN |
`b14` | BN |
`b15` | BN |
`b16` | BN |
`b2` | BN |
`b3` | BN |
`b4` | BN |
`b5` | BN |
`b6` | BN |
`b7` | BN |
`b8` | BN |
`b9` | BN |
`base` | BN |
`coefficient` | BN |
`noVowelDiscount` | BN |
`nonAlphaDiscount` | BN |

Defined in: [index.ts:35](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L35)

___

### Result

Ƭ **Result**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`data` | *any* |
`error`? | *string* |
`success` | *boolean* |

Defined in: [index.ts:29](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L29)

## Variables

### BNS\_CONTRACT\_ADDRESS

• `Const` **BNS\_CONTRACT\_ADDRESS**: *ST000000000000000000002AMW42H*= 'ST000000000000000000002AMW42H'

Defined in: [index.ts:26](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L26)

___

### BNS\_CONTRACT\_NAME

• `Const` **BNS\_CONTRACT\_NAME**: *bns*= 'bns'

Defined in: [index.ts:27](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L27)

## Functions

### canRegisterName

▸ **canRegisterName**(`fullyQualifiedName`: *string*, `network?`: StacksNetwork): *Promise*<boolean\>

Check if name can be registered

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`fullyQualifiedName` | *string* | the fully qualified name to check   |
`network?` | StacksNetwork | the Stacks network to broadcast transaction to    |

**Returns:** *Promise*<boolean\>

that resolves to true if the operation succeeds

Defined in: [index.ts:124](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L124)

___

### getNamePrice

▸ **getNamePrice**(`fullyQualifiedName`: *string*, `network?`: StacksNetwork): *Promise*<BN\>

Get price of name registration in microstacks

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`fullyQualifiedName` | *string* | the fully qualified name   |
`network?` | StacksNetwork | the Stacks network to use    |

**Returns:** *Promise*<BN\>

that resolves to a BN object number of microstacks if the operation succeeds

Defined in: [index.ts:209](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L209)

___

### getNamespacePrice

▸ **getNamespacePrice**(`namespace`: *string*, `network?`: StacksNetwork): *Promise*<BN\>

Get price of namespace registration in microstacks

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`namespace` | *string* | the namespace   |
`network?` | StacksNetwork | the Stacks network to use    |

**Returns:** *Promise*<BN\>

that resolves to a BN object number of microstacks if the operation succeeds

Defined in: [index.ts:166](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L166)

___

### importName

▸ **importName**(`__namedParameters`: [*ImportNameOptions*](interfaces/importnameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a namespace name import transaction.
An optional step in namespace registration.

Returns a Result object which will indicate if the transaction was successfully broadcasted.

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*ImportNameOptions*](interfaces/importnameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:405](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L405)

___

### preorderName

▸ **preorderName**(`__namedParameters`: [*PreorderNameOptions*](interfaces/preordernameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name preorder transaction.
First step in registering a name. This transaction does not reveal the name that is
about to be registered. And it sets the amount of STX to be burned for the registration.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*PreorderNameOptions*](interfaces/preordernameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:502](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L502)

___

### preorderNamespace

▸ **preorderNamespace**(`__namedParameters`: [*PreorderNamespaceOptions*](interfaces/preordernamespaceoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a namespace preorder transaction.
First step in registering a namespace. This transaction does not reveal the namespace that is
about to be registered. And it sets the amount of STX to be burned for the registration.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*PreorderNamespaceOptions*](interfaces/preordernamespaceoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:277](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L277)

___

### readyNamespace

▸ **readyNamespace**(`__namedParameters`: [*ReadyNamespaceOptions*](interfaces/readynamespaceoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a ready namespace transaction.
Final step in namespace registration. This completes the namespace registration and
makes the namespace available for name registrations.

Returns a Result object which will indicate if the transaction was successfully broadcasted.

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*ReadyNamespaceOptions*](interfaces/readynamespaceoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:455](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L455)

___

### registerName

▸ **registerName**(`__namedParameters`: [*RegisterNameOptions*](interfaces/registernameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name registration transaction.
Second and final step in registering a name.

Returns a Result object which will indicate if the transaction was successfully broadcast

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RegisterNameOptions*](interfaces/registernameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:557](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L557)

___

### renewName

▸ **renewName**(`__namedParameters`: [*RenewNameOptions*](interfaces/renewnameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name renew transaction.
This renews a name registration.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RenewNameOptions*](interfaces/renewnameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:778](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L778)

___

### revealNamespace

▸ **revealNamespace**(`__namedParameters`: [*RevealNamespaceOptions*](interfaces/revealnamespaceoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a namespace reveal transaction.
Second step in registering a namespace.

Returns a Result object which will indicate if the transaction was successfully broadcasted.

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RevealNamespaceOptions*](interfaces/revealnamespaceoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:331](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L331)

___

### revokeName

▸ **revokeName**(`__namedParameters`: [*RevokeNameOptions*](interfaces/revokenameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name revoke transaction.
This revokes a name registration.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*RevokeNameOptions*](interfaces/revokenameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:725](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L725)

___

### transferName

▸ **transferName**(`__namedParameters`: [*TransferNameOptions*](interfaces/transfernameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name transfer transaction.
This changes the owner of the registered name.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*TransferNameOptions*](interfaces/transfernameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:668](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L668)

___

### updateName

▸ **updateName**(`__namedParameters`: [*UpdateNameOptions*](interfaces/updatenameoptions.md)): *Promise*<[*Result*](modules.md#result)\>

Generates and broadcasts a name update transaction.
This changes the zonefile for the registered name.

Returns a Result object which will indicate if the transaction was successfully broadcasted

#### Parameters:

Name | Type |
:------ | :------ |
`__namedParameters` | [*UpdateNameOptions*](interfaces/updatenameoptions.md) |

**Returns:** *Promise*<[*Result*](modules.md#result)\>

Defined in: [index.ts:613](https://github.com/blockstack/stacks.js/blob/master/packages/bns/src/index.ts#L613)
