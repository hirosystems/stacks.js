# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.1.1](https://github.com/hirosystems/stacks.js/compare/v6.1.0...v6.1.1) (2023-01-30)

**Note:** Version bump only for package @stacks/network





## [6.1.0](https://github.com/hirosystems/stacks.js/compare/v6.0.2...v6.1.0) (2023-01-06)

**Note:** Version bump only for package @stacks/network





## [6.0.0](https://github.com/hirosystems/stacks.js/compare/v5.0.3...v6.0.0) (2022-11-23)

**Note:** Version bump only for package @stacks/network





## [5.0.3](https://github.com/hirosystems/stacks.js/compare/v5.0.2...v5.0.3) (2022-11-18)

**Note:** Version bump only for package @stacks/network





## [5.0.0](https://github.com/hirosystems/stacks.js/compare/v4.3.8...v5.0.0) (2022-09-30)


### ⚠ BREAKING CHANGES

* Removes compatibility with `bip32` package from @stacks/wallet-sdk. Now all derivation methods only rely on HDKey from @scure/bip32.
* To reduce the bundle sizes of applications using Stacks.js we are moving away from Buffer (a polyfill to match Node.js APIs) to Uint8Arrays (which Buffers use in the background anyway). To make the switch easier we have introduced a variety of methods for converting between strings and Uint8Arrays: `hexToBytes`, `bytesToHex`, `utf8ToBytes`, `bytesToUtf8`, `asciiToBytes`, `bytesToAscii`, and `concatBytes`.


### Features

* switch from buffer to uint8array ([#1343](https://github.com/hirosystems/stacks.js/issues/1343)) ([5445b73](https://github.com/hirosystems/stacks.js/commit/5445b73e05ec0c09414395331bfd37788545f1e1))



## [4.3.5](https://github.com/hirosystems/stacks.js/compare/v4.3.4...v4.3.5) (2022-08-23)

**Note:** Version bump only for package @stacks/network





## [4.3.4](https://github.com/hirosystems/stacks.js/compare/v4.3.3...v4.3.4) (2022-08-02)

**Note:** Version bump only for package @stacks/network





## [4.3.2](https://github.com/hirosystems/stacks.js/compare/v4.3.1...v4.3.2) (2022-07-11)

**Note:** Version bump only for package @stacks/network





# [4.3.0](https://github.com/hirosystems/stacks.js/compare/v4.2.2...v4.3.0) (2022-06-16)

**Note:** Version bump only for package @stacks/network





# [4.2.0](https://github.com/hirosystems/stacks.js/compare/v4.1.2...v4.2.0) (2022-05-25)

**Note:** Version bump only for package @stacks/network





# [4.1.0](https://github.com/blockstack/blockstack.js/compare/v4.0.2...v4.1.0) (2022-05-19)


### Features

* add fetch middleware for api keys and request init ([ef45632](https://github.com/blockstack/blockstack.js/commit/ef456327a3e1dcdc2aa364cbe55e47225029c5d2))





## [4.0.2](https://github.com/blockstack/blockstack.js/compare/v4.0.2-beta.1...v4.0.2) (2022-05-19)

**Note:** Version bump only for package @stacks/network





## [4.0.1](https://github.com/blockstack/blockstack.js/compare/v4.0.1-beta.1...v4.0.1) (2022-05-09)

**Note:** Version bump only for package @stacks/network





# [4.0.0](https://github.com/blockstack/blockstack.js/compare/v4.0.0-beta.2...v4.0.0) (2022-04-20)

**Note:** Version bump only for package @stacks/network





# [3.5.0](https://github.com/blockstack/blockstack.js/compare/v3.5.0-beta.3...v3.5.0) (2022-03-30)

**Note:** Version bump only for package @stacks/network





# [3.3.0](https://github.com/blockstack/blockstack.js/compare/v3.2.1-beta.0...v3.3.0) (2022-02-23)

**Note:** Version bump only for package @stacks/network





## [3.2.1-beta.0](https://github.com/blockstack/blockstack.js/compare/v3.2.0...v3.2.1-beta.0) (2022-02-23)

**Note:** Version bump only for package @stacks/network





# [3.2.0](https://github.com/blockstack/blockstack.js/compare/v3.1.1...v3.2.0) (2022-02-02)


### Features

* reduce reliance on network package ([422fda3](https://github.com/blockstack/blockstack.js/commit/422fda3cd43e16ae24ea9d97297b423a90823672))





## [2.0.1](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.2...v2.0.1) (2021-08-09)

**Note:** Version bump only for package @stacks/network





## [2.0.1-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.1...v2.0.1-beta.2) (2021-08-06)

**Note:** Version bump only for package @stacks/network





## [2.0.1-beta.1](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.1-beta.1) (2021-07-26)


### Bug Fixes

* BREAKING CHANGE: make coreApiUrl readonly for stacks network and initialize in constructor ([5d8cf6d](https://github.com/blockstack/blockstack.js/commit/5d8cf6d366665dace2df8102049d3f7ac1bf437e))
* broken types following diverged network config changes ([1cd9612](https://github.com/blockstack/blockstack.js/commit/1cd96128334465c461665cf079532f66b893b938))
* removeread only and add private field to prevent run time assignment ([62709aa](https://github.com/blockstack/blockstack.js/commit/62709aa5b6483299718063482bc26d6e94cc8c1c))


### Features

* add regtest to list of available networks ([f572477](https://github.com/blockstack/blockstack.js/commit/f572477ca0e5bc5e862c8a4e2fcc276655ee55a3)), closes [#1041](https://github.com/blockstack/blockstack.js/issues/1041)





# [2.0.0-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2021-07-26)


### Bug Fixes

* BREAKING CHANGE: make coreApiUrl readonly for stacks network and initialize in constructor ([5d8cf6d](https://github.com/blockstack/blockstack.js/commit/5d8cf6d366665dace2df8102049d3f7ac1bf437e))
* broken types following diverged network config changes ([1cd9612](https://github.com/blockstack/blockstack.js/commit/1cd96128334465c461665cf079532f66b893b938))
* removeread only and add private field to prevent run time assignment ([62709aa](https://github.com/blockstack/blockstack.js/commit/62709aa5b6483299718063482bc26d6e94cc8c1c))


### Features

* add regtest to list of available networks ([f572477](https://github.com/blockstack/blockstack.js/commit/f572477ca0e5bc5e862c8a4e2fcc276655ee55a3)), closes [#1041](https://github.com/blockstack/blockstack.js/issues/1041)
