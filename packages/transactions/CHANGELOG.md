# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.7.0](https://github.com/hirosystems/stacks.js/compare/v6.5.5...v6.7.0) (2023-07-24)

**Note:** Version bump only for package @stacks/transactions





## [6.6.0](https://github.com/hirosystems/stacks.js/compare/v6.5.5...v6.6.0) (2023-07-24)

**Note:** Version bump only for package @stacks/transactions





## [6.5.5](https://github.com/hirosystems/stacks.js/compare/v6.5.4...v6.5.5) (2023-07-14)


### Bug Fixes

* remove post-conditions from stx transfer ([679a93a](https://github.com/hirosystems/stacks.js/commit/679a93afd75253d21bec070c85b843c34aeb516b))
* throw error if the number type used in the bigint constructor is not a safe integer value ([d6a6fcc](https://github.com/hirosystems/stacks.js/commit/d6a6fcc30e4306d90da091e2538a281968dc9ac4))
* update pc types to allow strict type checking ([#1494](https://github.com/hirosystems/stacks.js/issues/1494)) ([b916ef0](https://github.com/hirosystems/stacks.js/commit/b916ef06e8498f3b14403f850fc8a39881311ea7))



## [6.5.4](https://github.com/hirosystems/stacks.js/compare/v6.5.3...v6.5.4) (2023-05-17)

**Note:** Version bump only for package @stacks/transactions





## [6.5.2](https://github.com/hirosystems/stacks.js/compare/v6.5.1...v6.5.2) (2023-04-28)


### Bug Fixes

* add `Cl` helper ([#1479](https://github.com/hirosystems/stacks.js/issues/1479)) ([c116a85](https://github.com/hirosystems/stacks.js/commit/c116a851c499d26326f94c368d74d75d0bf76627))



## [6.5.1](https://github.com/hirosystems/stacks.js/compare/v6.5.0...v6.5.1) (2023-04-19)

**Note:** Version bump only for package @stacks/transactions





## [6.5.0](https://github.com/hirosystems/stacks.js/compare/v6.4.0...v6.5.0) (2023-03-26)


### Features

* add pc post condition builder ([#1466](https://github.com/hirosystems/stacks.js/issues/1466)) ([ac254ba](https://github.com/hirosystems/stacks.js/commit/ac254badb73401a77f984f6fe62e8f198419786b))



## [6.4.0](https://github.com/hirosystems/stacks.js/compare/v6.3.0...v6.4.0) (2023-03-19)


### Features

* switch makeContractDeploy and makeUnsignedContractDeploy to use clarity 2 by default ([244636f](https://github.com/hirosystems/stacks.js/commit/244636fbd07a8c5f0fefa4671a88036412932fa0))



## [6.3.0](https://github.com/hirosystems/stacks.js/compare/v6.2.1...v6.3.0) (2023-03-17)


### Features

* implement `getContractMapEntry` function ([#1461](https://github.com/hirosystems/stacks.js/issues/1461)) ([7031ead](https://github.com/hirosystems/stacks.js/commit/7031ead112f7333d165f5946eae0481f6aa9a20f))



## [6.2.0](https://github.com/hirosystems/stacks.js/compare/v6.1.1...v6.2.0) (2023-02-22)


### Features

* allow string name for AnchorMode ([a039c33](https://github.com/hirosystems/stacks.js/commit/a039c33292436057bd5e73d4f796441794141f96))


### Bug Fixes

* a few Clarity value construction functions were not being exported ([f0ba4a2](https://github.com/hirosystems/stacks.js/commit/f0ba4a2f0d597c27839ff1f15b2b73514ca25fd3))



## [6.1.1](https://github.com/hirosystems/stacks.js/compare/v6.1.0...v6.1.1) (2023-01-30)

**Note:** Version bump only for package @stacks/transactions





## [6.1.0](https://github.com/hirosystems/stacks.js/compare/v6.0.2...v6.1.0) (2023-01-06)


### Features

* add estimation fallback ([782a3c3](https://github.com/hirosystems/stacks.js/commit/782a3c392969e8736a4d6c7c27d491bf2e35bac6))



## [6.0.0](https://github.com/hirosystems/stacks.js/compare/v5.0.3...v6.0.0) (2022-11-23)


### Features

* add coinbase-to-alt-recipient payload type ([836b181](https://github.com/hirosystems/stacks.js/commit/836b181eca3fd2904baf2587c7875d6a6e8c95bd))
* add payload type assertions ([#1395](https://github.com/hirosystems/stacks.js/issues/1395)) ([cdd32e9](https://github.com/hirosystems/stacks.js/commit/cdd32e9323069452a4d0345174b049be1c8e1069))
* support `versioned-smart-contract` tx types introduced in Stacks 2.1 ([#1341](https://github.com/hirosystems/stacks.js/issues/1341)) ([0062a45](https://github.com/hirosystems/stacks.js/commit/0062a453fec80de93d36e0d8c5e3f37a7522c300))



## [5.0.3](https://github.com/hirosystems/stacks.js/compare/v5.0.2...v5.0.3) (2022-11-18)

**Note:** Version bump only for package @stacks/transactions





## [5.0.2](https://github.com/hirosystems/stacks.js/compare/v5.0.1...v5.0.2) (2022-10-19)


### Bug Fixes

* rename incorrect nft post-condition codes ([9fed6a4](https://github.com/hirosystems/stacks.js/commit/9fed6a425a2803a27cf919c3038e6a5220ada465))



## [5.0.1](https://github.com/hirosystems/stacks.js/compare/v5.0.0...v5.0.1) (2022-10-04)


### Bug Fixes

* rename incorrect nft post-condition codes ([dddeb68](https://github.com/hirosystems/stacks.js/commit/dddeb6891b5ff2f6c2d2a7eb089c850a9a8c32b7))



## [5.0.0](https://github.com/hirosystems/stacks.js/compare/v4.3.8...v5.0.0) (2022-09-30)


### ⚠ BREAKING CHANGES

* Post-conditions for NFTs were renamed to be more clear: `Owns` to `Sends`, `DoesNotOwn` to `DoesNotSend`.
* remove previously deprecated functions
* Removes compatibility with `bip32` package from @stacks/wallet-sdk. Now all derivation methods only rely on HDKey from @scure/bip32.
* To reduce the bundle sizes of applications using Stacks.js we are moving away from Buffer (a polyfill to match Node.js APIs) to Uint8Arrays (which Buffers use in the background anyway). To make the switch easier we have introduced a variety of methods for converting between strings and Uint8Arrays: `hexToBytes`, `bytesToHex`, `utf8ToBytes`, `bytesToUtf8`, `asciiToBytes`, `bytesToAscii`, and `concatBytes`.


### Features

* switch from buffer to uint8array ([#1343](https://github.com/hirosystems/stacks.js/issues/1343)) ([5445b73](https://github.com/hirosystems/stacks.js/commit/5445b73e05ec0c09414395331bfd37788545f1e1))


### Bug Fixes

* remove previously deprecated functions ([b2a5f96](https://github.com/hirosystems/stacks.js/commit/b2a5f96fd24e8da7cb9b4e1cf4d7b654f6e5b00c))
* update post-condition names for non-fungible tokens ([9fbdcea](https://github.com/hirosystems/stacks.js/commit/9fbdcea262a4f8af24740e35b58c886e636ad292))



## [4.3.8](https://github.com/hirosystems/stacks.js/compare/v4.3.7...v4.3.8) (2022-09-29)

**Note:** Version bump only for package @stacks/transactions





## [4.3.7](https://github.com/hirosystems/stacks.js/compare/v4.3.6...v4.3.7) (2022-09-28)


### Bug Fixes

* correctly verify future message signing prefix ([d27e054](https://github.com/hirosystems/stacks.js/commit/d27e054f2639fcea4c873ce942d966e2aa4ca926))



## [4.3.5](https://github.com/hirosystems/stacks.js/compare/v4.3.4...v4.3.5) (2022-08-23)

**Note:** Version bump only for package @stacks/transactions





## [4.3.4](https://github.com/hirosystems/stacks.js/compare/v4.3.3...v4.3.4) (2022-08-02)


### Bug Fixes

* migrate subdomains to wallet key address ([b32cb41](https://github.com/hirosystems/stacks.js/commit/b32cb417f593200b1de13a704eceda7c3ab7f5a8))





## [4.3.3](https://github.com/hirosystems/stacks.js/compare/v4.3.2...v4.3.3) (2022-07-19)

**Note:** Version bump only for package @stacks/transactions





## [4.3.2](https://github.com/hirosystems/stacks.js/compare/v4.3.1...v4.3.2) (2022-07-11)

**Note:** Version bump only for package @stacks/transactions





## [4.3.1](https://github.com/hirosystems/stacks.js/compare/v4.3.0...v4.3.1) (2022-07-01)

**Note:** Version bump only for package @stacks/transactions





# [4.3.0](https://github.com/hirosystems/stacks.js/compare/v4.2.2...v4.3.0) (2022-06-16)


### Bug Fixes

* add clarity typedoc annotations ([b95783d](https://github.com/hirosystems/stacks.js/commit/b95783db54d8a5294c7f10e67ccb0f2c529aef75))
* export structuredDataSignature ([5e8736b](https://github.com/hirosystems/stacks.js/commit/5e8736bcf572d7334947c040b218a82598bfb2e0))


### Features

* add SIP-018 support ([a4c0577](https://github.com/hirosystems/stacks.js/commit/a4c0577c7e6fb5010eb886c3b04c2636282e442a)), closes [#1283](https://github.com/hirosystems/stacks.js/issues/1283) [#1281](https://github.com/hirosystems/stacks.js/issues/1281)





# [4.2.0](https://github.com/hirosystems/stacks.js/compare/v4.1.2...v4.2.0) (2022-05-25)


### Bug Fixes

* offload bitcoinjs from stacking, closes [#1259](https://github.com/hirosystems/stacks.js/issues/1259) ([8912bca](https://github.com/hirosystems/stacks.js/commit/8912bca06b1281e453ff09b3513f0e08906eeae6))


### Features

* add missing rsv functions ([4e7fcf5](https://github.com/hirosystems/stacks.js/commit/4e7fcf5b9ae2000a903d49ac31a424349f839637))





# [4.1.0](https://github.com/hirosystems/stacks.js/compare/v4.0.2...v4.1.0) (2022-05-19)


### Features

* add fetch middleware for api keys and request init ([ef45632](https://github.com/hirosystems/stacks.js/commit/ef456327a3e1dcdc2aa364cbe55e47225029c5d2))





## [4.0.2](https://github.com/hirosystems/stacks.js/compare/v4.0.2-beta.1...v4.0.2) (2022-05-19)


### Bug Fixes

* **message-signing:** add working utility fn ([20b721c](https://github.com/hirosystems/stacks.js/commit/20b721cdccc2fb73f98aad80eb6d5e8e9cb987d0))





## [4.0.1](https://github.com/hirosystems/stacks.js/compare/v4.0.1-beta.1...v4.0.1) (2022-05-09)


### Bug Fixes

* allow referrer header in request options ([70ea915](https://github.com/hirosystems/stacks.js/commit/70ea9156f6916f32e40adf7464322476a9acd8ab))





# [4.0.0](https://github.com/hirosystems/stacks.js/compare/v4.0.0-beta.2...v4.0.0) (2022-04-20)

**Note:** Version bump only for package @stacks/transactions





# [3.5.0](https://github.com/hirosystems/stacks.js/compare/v3.5.0-beta.3...v3.5.0) (2022-03-30)

**Note:** Version bump only for package @stacks/transactions





# [3.3.0](https://github.com/hirosystems/stacks.js/compare/v3.2.1-beta.0...v3.3.0) (2022-02-23)

**Note:** Version bump only for package @stacks/transactions





## [3.2.1-beta.0](https://github.com/hirosystems/stacks.js/compare/v3.2.0...v3.2.1-beta.0) (2022-02-23)


### Bug Fixes

* use noble-secp256k1 in transaction to replace elliptic dependency ([534f1b8](https://github.com/hirosystems/stacks.js/commit/534f1b8acf5ab1267860af0d2a9f1ba19bb35303))





# [3.2.0](https://github.com/blockstack/blockstack.js/compare/v3.1.1...v3.2.0) (2022-02-02)


### Bug Fixes

* remove lodash dependency ([96b3064](https://github.com/blockstack/blockstack.js/commit/96b306446510eba33fe99665e0e02a84bca901c5))


### Features

* reduce reliance on network package ([422fda3](https://github.com/blockstack/blockstack.js/commit/422fda3cd43e16ae24ea9d97297b423a90823672))





# [3.1.0](https://github.com/blockstack/blockstack.js/compare/v3.0.0...v3.1.0) (2021-12-16)

**Note:** Version bump only for package @stacks/transactions





## [2.0.1](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.2...v2.0.1) (2021-08-09)

**Note:** Version bump only for package @stacks/transactions





## [2.0.1-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.1...v2.0.1-beta.2) (2021-08-06)

**Note:** Version bump only for package @stacks/transactions





## [2.0.1-beta.1](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.1-beta.1) (2021-07-26)


### Bug Fixes

* always return string quoted integer rather than `number | string` depending on bit size ([6af4abe](https://github.com/blockstack/blockstack.js/commit/6af4abe92e995140d4e8becab3aacabd17dbce92))
* bn.js lib accepts strings containing non-integer values and results in weird behavior ([da07f10](https://github.com/blockstack/blockstack.js/commit/da07f108061a29af1879eef6b6054e0a45b6b9d1))
* BREAKING CHANGE: make the broadcastTransaction response type consistent and always return an object ([3e4c197](https://github.com/blockstack/blockstack.js/commit/3e4c197f3a4763bc4ec6b7165cbd9db793bc2c2d))
* handle empty list in getCVTypeString ([#1033](https://github.com/blockstack/blockstack.js/issues/1033)) ([1ff5b03](https://github.com/blockstack/blockstack.js/commit/1ff5b03c28c664953260105d333cebfa2fd64e5f))
* prettify ([b471de9](https://github.com/blockstack/blockstack.js/commit/b471de968acba970b1c5337100220cc75a05e44e))
* The transaction ABI validation should accept lists that are less than or equal to the max size specified in the arguments type ([53dd641](https://github.com/blockstack/blockstack.js/commit/53dd6410554dea195dc7e206d39a1995c6fc1fae))


### Features

* refactor all js `number` and `bn.js` usages in Clarity integer values to native bigint ([1f78339](https://github.com/blockstack/blockstack.js/commit/1f783397e7f5b38aabb6e0342af71b58022aed4c))





# [2.0.0-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2021-07-26)


### Bug Fixes

* always return string quoted integer rather than `number | string` depending on bit size ([6af4abe](https://github.com/blockstack/blockstack.js/commit/6af4abe92e995140d4e8becab3aacabd17dbce92))
* bn.js lib accepts strings containing non-integer values and results in weird behavior ([da07f10](https://github.com/blockstack/blockstack.js/commit/da07f108061a29af1879eef6b6054e0a45b6b9d1))
* BREAKING CHANGE: make the broadcastTransaction response type consistent and always return an object ([3e4c197](https://github.com/blockstack/blockstack.js/commit/3e4c197f3a4763bc4ec6b7165cbd9db793bc2c2d))
* handle empty list in getCVTypeString ([#1033](https://github.com/blockstack/blockstack.js/issues/1033)) ([1ff5b03](https://github.com/blockstack/blockstack.js/commit/1ff5b03c28c664953260105d333cebfa2fd64e5f))
* prettify ([b471de9](https://github.com/blockstack/blockstack.js/commit/b471de968acba970b1c5337100220cc75a05e44e))
* The transaction ABI validation should accept lists that are less than or equal to the max size specified in the arguments type ([53dd641](https://github.com/blockstack/blockstack.js/commit/53dd6410554dea195dc7e206d39a1995c6fc1fae))


### Features

* refactor all js `number` and `bn.js` usages in Clarity integer values to native bigint ([1f78339](https://github.com/blockstack/blockstack.js/commit/1f783397e7f5b38aabb6e0342af71b58022aed4c))





## [1.4.1](https://github.com/blockstack/blockstack.js.gi/compare/v1.4.1-alpha.0...v1.4.1) (2021-04-20)

**Note:** Version bump only for package @stacks/transactions





## [1.3.5](https://github.com/blockstack/blockstack.js.gi/compare/v1.3.4...v1.3.5) (2021-03-26)


### Bug Fixes

* use spending conditions key encoding to properly recover public key ([a0dbba8](https://github.com/blockstack/blockstack.js.gi/commit/a0dbba8710a2e9e2b5690b8f380c7b9d1db41875))





## [1.3.3](https://github.com/blockstack/blockstack.js.gi/compare/v1.3.2...v1.3.3) (2021-03-18)


### Bug Fixes

* export cvToValue function ([42c138b](https://github.com/blockstack/blockstack.js.gi/commit/42c138b975ea08e75fea78db39b77166c08f193b))





# [1.3.0](https://github.com/blockstack/blockstack.js.gi/compare/v1.2.4...v1.3.0) (2021-03-08)


### Features

* add hex string and Buffer support to `deserializedTransaction` ([be379b2](https://github.com/blockstack/blockstack.js.gi/commit/be379b257a31329618e5e9db91e25bbe3bef1b61))
* properly serialize uncompressed auth fields ([e259fe1](https://github.com/blockstack/blockstack.js.gi/commit/e259fe176478c3ae35f1d12d9f77be377c167f65))





## [1.2.4](https://github.com/blockstack/blockstack.js.gi/compare/v1.2.3...v1.2.4) (2021-02-26)

**Note:** Version bump only for package @stacks/transactions





## [1.2.3](https://github.com/blockstack/blockstack.js.gi/compare/v1.2.2...v1.2.3) (2021-02-25)


### Bug Fixes

* export cvToValue function ([835e68e](https://github.com/blockstack/blockstack.js.gi/commit/835e68e14e346c2417ac21c1c85bdc68d3de6e2e))
