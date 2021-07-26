# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.1-beta.1](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.1-beta.1) (2021-07-26)


### Bug Fixes

* add missing stx burn and NFT post conditions ([7e0fcba](https://github.com/blockstack/blockstack.js/commit/7e0fcba3f52062e9531923e82676e1121a9a3eb0))
* always return string quoted integer rather than `number | string` depending on bit size ([6af4abe](https://github.com/blockstack/blockstack.js/commit/6af4abe92e995140d4e8becab3aacabd17dbce92))
* bn.js lib accepts strings containing non-integer values and results in weird behavior ([da07f10](https://github.com/blockstack/blockstack.js/commit/da07f108061a29af1879eef6b6054e0a45b6b9d1))
* BREAKING CHANGE: make coreApiUrl readonly for stacks network and initialize in constructor ([5d8cf6d](https://github.com/blockstack/blockstack.js/commit/5d8cf6d366665dace2df8102049d3f7ac1bf437e))
* BREAKING CHANGE: make the broadcastTransaction response type consistent and always return an object ([3e4c197](https://github.com/blockstack/blockstack.js/commit/3e4c197f3a4763bc4ec6b7165cbd9db793bc2c2d))
* broken types following diverged network config changes ([1cd9612](https://github.com/blockstack/blockstack.js/commit/1cd96128334465c461665cf079532f66b893b938))
* fix optional argument encoding and update test cases in bns transferName, renewName calls ([6f4f8fa](https://github.com/blockstack/blockstack.js/commit/6f4f8fa67e208541adf9acbe780f74a8d002e5a2))
* fix stx balance command crash if address not valid ([8cc69df](https://github.com/blockstack/blockstack.js/commit/8cc69df21bc33eda6e9ec3cd6be6bfca2ec7b8ad))
* fixed lint issue ([1dab3a9](https://github.com/blockstack/blockstack.js/commit/1dab3a9d17fec2e4dd9f075f97cf28a1b93a6da7))
* generated explorer URL for faucet command ([38540a9](https://github.com/blockstack/blockstack.js/commit/38540a9e328a42e90a78861d9c62c8033a0679bc))
* handle empty list in getCVTypeString ([#1033](https://github.com/blockstack/blockstack.js/issues/1033)) ([1ff5b03](https://github.com/blockstack/blockstack.js/commit/1ff5b03c28c664953260105d333cebfa2fd64e5f))
* prettify ([b471de9](https://github.com/blockstack/blockstack.js/commit/b471de968acba970b1c5337100220cc75a05e44e))
* remove console.log ([3e55c94](https://github.com/blockstack/blockstack.js/commit/3e55c94d1bef2417aa3f25710c3171632c1ac8f3))
* remove unused const ([e506cf3](https://github.com/blockstack/blockstack.js/commit/e506cf3b5faf2d030b4e6da82e330002783db1c0))
* removeread only and add private field to prevent run time assignment ([62709aa](https://github.com/blockstack/blockstack.js/commit/62709aa5b6483299718063482bc26d6e94cc8c1c))
* The transaction ABI validation should accept lists that are less than or equal to the max size specified in the arguments type ([53dd641](https://github.com/blockstack/blockstack.js/commit/53dd6410554dea195dc7e206d39a1995c6fc1fae))
* use stacks.js repo url ([cd2a684](https://github.com/blockstack/blockstack.js/commit/cd2a6849d6a2bf20109f85ac2c9afe467accf1a9))
* verify that the public key is a secp256k1 point ([1cfef11](https://github.com/blockstack/blockstack.js/commit/1cfef115515aaa6f97fe188f29c4f66f198aefcd))


### Features

* add @stacks/wallet-sdk package ([49783f9](https://github.com/blockstack/blockstack.js/commit/49783f9713e7a016909f76ab816fdd486d22daae))
* add regtest to list of available networks ([f572477](https://github.com/blockstack/blockstack.js/commit/f572477ca0e5bc5e862c8a4e2fcc276655ee55a3)), closes [#1041](https://github.com/blockstack/blockstack.js/issues/1041)
* refactor all js `number` and `bn.js` usages in Clarity integer values to native bigint ([1f78339](https://github.com/blockstack/blockstack.js/commit/1f783397e7f5b38aabb6e0342af71b58022aed4c))





## [1.4.1](https://github.com/blockstack/blockstack.js/compare/v1.4.1-alpha.0...v1.4.1) (2021-04-20)

**Note:** Version bump only for package stacks.js





## [1.3.5](https://github.com/blockstack/blockstack.js/compare/v1.3.4...v1.3.5) (2021-03-26)


### Bug Fixes

* use spending conditions key encoding to properly recover public key ([a0dbba8](https://github.com/blockstack/blockstack.js/commit/a0dbba8710a2e9e2b5690b8f380c7b9d1db41875))





## [1.3.4](https://github.com/blockstack/blockstack.js/compare/v1.3.3...v1.3.4) (2021-03-18)


### Features

* export stacking/utils functions ([24c7314](https://github.com/blockstack/blockstack.js/commit/24c73148afafceb5be9e172a8bc325e1ad54a800))


### Reverts

* Revert "v1.4.0" ([4356ddb](https://github.com/blockstack/blockstack.js/commit/4356ddbc8d83a83c97efaf6d8d1a7abefbc4f6d9))





## [1.3.3](https://github.com/blockstack/blockstack.js/compare/v1.3.2...v1.3.3) (2021-03-18)


### Bug Fixes

* [#973](https://github.com/blockstack/blockstack.js/issues/973) stacking lib only allow p2pkh and p2sh btc addresses ([af00bd5](https://github.com/blockstack/blockstack.js/commit/af00bd5f315a4877f6af0fd71e6373d664afbe6a))
* export cvToValue function ([42c138b](https://github.com/blockstack/blockstack.js/commit/42c138b975ea08e75fea78db39b77166c08f193b))
* package.json to reduce vulnerabilities ([48a72fb](https://github.com/blockstack/blockstack.js/commit/48a72fba2eda7e5f0bc7dbd649f274f88d01bd1d))





## [1.3.2](https://github.com/blockstack/blockstack.js/compare/v1.3.1...v1.3.2) (2021-03-11)

**Note:** Version bump only for package stacks.js





## [1.3.1](https://github.com/blockstack/blockstack.js.gi/compare/v1.3.0...v1.3.1) (2021-03-10)

**Note:** Version bump only for package stacks.js





# [1.3.0](https://github.com/blockstack/blockstack.js.gi/compare/v1.2.4...v1.3.0) (2021-03-08)


### Features

* add hex string and Buffer support to `deserializedTransaction` ([be379b2](https://github.com/blockstack/blockstack.js.gi/commit/be379b257a31329618e5e9db91e25bbe3bef1b61))
* properly serialize uncompressed auth fields ([e259fe1](https://github.com/blockstack/blockstack.js.gi/commit/e259fe176478c3ae35f1d12d9f77be377c167f65))





## [1.2.4](https://github.com/blockstack/blockstack.js/compare/v1.2.3...v1.2.4) (2021-02-26)

**Note:** Version bump only for package stacks.js





## [1.2.3](https://github.com/blockstack/blockstack.js/compare/v1.2.2...v1.2.3) (2021-02-25)


### Bug Fixes

* don't multiply with cycleDuration ([a6fab4e](https://github.com/blockstack/blockstack.js/commit/a6fab4e5c3038cf4eaa7bd997b7d4c5104ca6858))
* export cvToValue function ([835e68e](https://github.com/blockstack/blockstack.js/commit/835e68e14e346c2417ac21c1c85bdc68d3de6e2e))
* getDelegateStxOptions ([42eea7e](https://github.com/blockstack/blockstack.js/commit/42eea7ec9da23fae67ea8499e0db51665acffe0e))
