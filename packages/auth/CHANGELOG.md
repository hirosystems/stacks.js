# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.7.0](https://github.com/hirosystems/stacks.js/compare/v6.5.5...v6.7.0) (2023-07-24)

**Note:** Version bump only for package @stacks/auth





## [6.5.5](https://github.com/hirosystems/stacks.js/compare/v6.5.4...v6.5.5) (2023-07-14)

**Note:** Version bump only for package @stacks/auth





## [6.5.4](https://github.com/hirosystems/stacks.js/compare/v6.5.3...v6.5.4) (2023-05-17)

**Note:** Version bump only for package @stacks/auth





## [6.5.2](https://github.com/hirosystems/stacks.js/compare/v6.5.1...v6.5.2) (2023-04-28)

**Note:** Version bump only for package @stacks/auth





## [6.5.1](https://github.com/hirosystems/stacks.js/compare/v6.5.0...v6.5.1) (2023-04-19)

**Note:** Version bump only for package @stacks/auth





## [6.3.0](https://github.com/hirosystems/stacks.js/compare/v6.2.1...v6.3.0) (2023-03-17)

**Note:** Version bump only for package @stacks/auth





## [6.2.0](https://github.com/hirosystems/stacks.js/compare/v6.1.1...v6.2.0) (2023-02-22)

**Note:** Version bump only for package @stacks/auth





## [6.1.1](https://github.com/hirosystems/stacks.js/compare/v6.1.0...v6.1.1) (2023-01-30)

**Note:** Version bump only for package @stacks/auth





## [6.1.0](https://github.com/hirosystems/stacks.js/compare/v6.0.2...v6.1.0) (2023-01-06)

**Note:** Version bump only for package @stacks/auth





## [6.0.0](https://github.com/hirosystems/stacks.js/compare/v5.0.3...v6.0.0) (2022-11-23)

**Note:** Version bump only for package @stacks/auth





## [5.0.3](https://github.com/hirosystems/stacks.js/compare/v5.0.2...v5.0.3) (2022-11-18)

**Note:** Version bump only for package @stacks/auth





## [5.0.2](https://github.com/hirosystems/stacks.js/compare/v5.0.1...v5.0.2) (2022-10-19)

**Note:** Version bump only for package @stacks/auth





## [5.0.1](https://github.com/hirosystems/stacks.js/compare/v5.0.0...v5.0.1) (2022-10-04)

**Note:** Version bump only for package @stacks/auth





## [5.0.0](https://github.com/hirosystems/stacks.js/compare/v4.3.8...v5.0.0) (2022-09-30)


### ⚠ BREAKING CHANGES

* remove previously deprecated functions
* Removes compatibility with `bip32` package from @stacks/wallet-sdk. Now all derivation methods only rely on HDKey from @scure/bip32.
* To reduce the bundle sizes of applications using Stacks.js we are moving away from Buffer (a polyfill to match Node.js APIs) to Uint8Arrays (which Buffers use in the background anyway). To make the switch easier we have introduced a variety of methods for converting between strings and Uint8Arrays: `hexToBytes`, `bytesToHex`, `utf8ToBytes`, `bytesToUtf8`, `asciiToBytes`, `bytesToAscii`, and `concatBytes`.


### Features

* switch from buffer to uint8array ([#1343](https://github.com/hirosystems/stacks.js/issues/1343)) ([5445b73](https://github.com/hirosystems/stacks.js/commit/5445b73e05ec0c09414395331bfd37788545f1e1))


### Bug Fixes

* remove previously deprecated functions ([b2a5f96](https://github.com/hirosystems/stacks.js/commit/b2a5f96fd24e8da7cb9b4e1cf4d7b654f6e5b00c))



## [4.3.8](https://github.com/hirosystems/stacks.js/compare/v4.3.7...v4.3.8) (2022-09-29)

**Note:** Version bump only for package @stacks/auth





## [4.3.7](https://github.com/hirosystems/stacks.js/compare/v4.3.6...v4.3.7) (2022-09-28)

**Note:** Version bump only for package @stacks/auth





## [4.3.5](https://github.com/hirosystems/stacks.js/compare/v4.3.4...v4.3.5) (2022-08-23)

**Note:** Version bump only for package @stacks/auth





## [4.3.4](https://github.com/hirosystems/stacks.js/compare/v4.3.3...v4.3.4) (2022-08-02)

**Note:** Version bump only for package @stacks/auth





## [4.3.3](https://github.com/hirosystems/stacks.js/compare/v4.3.2...v4.3.3) (2022-07-19)

**Note:** Version bump only for package @stacks/auth





## [4.3.2](https://github.com/hirosystems/stacks.js/compare/v4.3.1...v4.3.2) (2022-07-11)

**Note:** Version bump only for package @stacks/auth





## [4.3.1](https://github.com/hirosystems/stacks.js/compare/v4.3.0...v4.3.1) (2022-07-01)

**Note:** Version bump only for package @stacks/auth





# [4.3.0](https://github.com/hirosystems/stacks.js/compare/v4.2.2...v4.3.0) (2022-06-16)

**Note:** Version bump only for package @stacks/auth





## [4.2.2](https://github.com/hirosystems/stacks.js/compare/v4.2.2-beta.0...v4.2.2) (2022-06-01)

**Note:** Version bump only for package @stacks/auth





# [4.2.0](https://github.com/hirosystems/stacks.js/compare/v4.1.2...v4.2.0) (2022-05-25)

**Note:** Version bump only for package @stacks/auth





# [4.1.0](https://github.com/blockstack/blockstack.js/compare/v4.0.2...v4.1.0) (2022-05-19)


### Features

* add fetch middleware for api keys and request init ([ef45632](https://github.com/blockstack/blockstack.js/commit/ef456327a3e1dcdc2aa364cbe55e47225029c5d2))





## [4.0.2](https://github.com/blockstack/blockstack.js/compare/v4.0.2-beta.1...v4.0.2) (2022-05-19)

**Note:** Version bump only for package @stacks/auth





## [4.0.1](https://github.com/blockstack/blockstack.js/compare/v4.0.1-beta.1...v4.0.1) (2022-05-09)

**Note:** Version bump only for package @stacks/auth





# [4.0.0](https://github.com/blockstack/blockstack.js/compare/v4.0.0-beta.2...v4.0.0) (2022-04-20)

**Note:** Version bump only for package @stacks/auth





# [3.5.0](https://github.com/blockstack/blockstack.js/compare/v3.5.0-beta.3...v3.5.0) (2022-03-30)

**Note:** Version bump only for package @stacks/auth





# [3.3.0](https://github.com/blockstack/blockstack.js/compare/v3.2.1-beta.0...v3.3.0) (2022-02-23)

**Note:** Version bump only for package @stacks/auth





## [3.2.1-beta.0](https://github.com/blockstack/blockstack.js/compare/v3.2.0...v3.2.1-beta.0) (2022-02-23)

**Note:** Version bump only for package @stacks/auth





# [3.2.0](https://github.com/blockstack/blockstack.js/compare/v3.1.1...v3.2.0) (2022-02-02)


### Features

* reduce reliance on network package ([422fda3](https://github.com/blockstack/blockstack.js/commit/422fda3cd43e16ae24ea9d97297b423a90823672))





# [3.1.0](https://github.com/blockstack/blockstack.js/compare/v3.0.0...v3.1.0) (2021-12-16)


### Bug Fixes

* update default core node url ([1208996](https://github.com/blockstack/blockstack.js/commit/120899670b35cca31f49daa9cc5c05a6061dc9aa))





## [2.0.1](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.2...v2.0.1) (2021-08-09)

**Note:** Version bump only for package @stacks/auth





## [2.0.1-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.1...v2.0.1-beta.2) (2021-08-06)

**Note:** Version bump only for package @stacks/auth





## [2.0.1-beta.1](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.1-beta.1) (2021-07-26)

**Note:** Version bump only for package @stacks/auth





# [2.0.0-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2021-07-26)

**Note:** Version bump only for package @stacks/auth





## [1.2.3](https://github.com/blockstack/blockstack.js/compare/v1.2.2...v1.2.3) (2021-02-25)

**Note:** Version bump only for package @stacks/auth
