# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
