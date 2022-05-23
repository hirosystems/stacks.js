# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1.2](https://github.com/hirosystems/stacks.js/compare/v4.2.0-beta.3...v4.1.2) (2022-05-23)

**Note:** Version bump only for package root





## [4.1.1](https://github.com/hirosystems/stacks.js/compare/v4.2.0-beta.1...v4.1.1) (2022-05-19)

**Note:** Version bump only for package root





# [4.1.0](https://github.com/hirosystems/stacks.js/compare/v4.0.2...v4.1.0) (2022-05-19)


### Features

* add fetch middleware for api keys and request init ([ef45632](https://github.com/hirosystems/stacks.js/commit/ef456327a3e1dcdc2aa364cbe55e47225029c5d2))





## [4.0.2](https://github.com/hirosystems/stacks.js/compare/v4.0.2-beta.1...v4.0.2) (2022-05-19)


### Bug Fixes

* **message-signing:** add working utility fn ([20b721c](https://github.com/hirosystems/stacks.js/commit/20b721cdccc2fb73f98aad80eb6d5e8e9cb987d0))





## [4.0.1](https://github.com/hirosystems/stacks.js/compare/v4.0.1-beta.1...v4.0.1) (2022-05-09)


### Bug Fixes

* allow referrer header in request options ([70ea915](https://github.com/hirosystems/stacks.js/commit/70ea9156f6916f32e40adf7464322476a9acd8ab))





# [4.0.0](https://github.com/hirosystems/stacks.js/compare/v3.5.0...v4.0.0) (2022-04-20)


### BREAKING CHANGES

* This change REMOVES the `username` attribute from auth token payloads and therefore also from userData in @stacks/connect. Hence, there is NO MORE username verification done by @stacks/connect automatically.

### Bug Fixes

* remove doPublicKeysMatchUsername ([e2f3cf9](https://github.com/hirosystems/stacks.js/commit/e2f3cf93f1ae5148f78620e37786104cd482d7e1))
* remove username checking ([e32781b](https://github.com/hirosystems/stacks.js/commit/e32781ba2a8af5afbe83b4a02419e0cc4a6f5bb0))
* deserialize partially signed multisig transaction ([52d4045](https://github.com/hirosystems/stacks.js/commit/52d4045abb5b91fe48756f743cfda5eff135f7dc))
* offload bip32 dependency from wallet-sdk ([c729006](https://github.com/hirosystems/stacks.js/commit/c729006b8d37a18005adff146aea5f0f9aaf6d5d))
* offload bip39 dependency from encryption ([7973100](https://github.com/hirosystems/stacks.js/commit/797310003c981b8eb5e081f0f89e082986cd76d2))
* private key compression ([cf0a3ab](https://github.com/hirosystems/stacks.js/commit/cf0a3ab9b04876c942d241e554e96db17e512b5b))


### Features

* Add encode / decode messages to support ([ad300fb](https://github.com/hirosystems/stacks.js/commit/ad300fb1564331aebe70e710dfd8039312d4a17d)), closes [#1231](https://github.com/hirosystems/stacks.js/issues/1231)
* remove username from payload and userdata ([926c549](https://github.com/hirosystems/stacks.js/commit/926c549d15ea5488820f5a4a144ca74e6d30211d))





# [3.5.0](https://github.com/hirosystems/stacks.js/compare/v3.4.0...v3.5.0) (2022-03-30)


### Bug Fixes

* offload ramdombytes library from encryption ([fe3f30e](https://github.com/hirosystems/stacks.js/commit/fe3f30ee4ea110ef150a1b407bde0af2feba6783))
* use noble-secp256k1 in encryption to replace elliptic dependency ([8cc1774](https://github.com/hirosystems/stacks.js/commit/8cc1774d06cbe63ba4188800b57cc8cc159712a6))
* use noble-secp256k1 in encryption to replace elliptic dependency ([ca778e4](https://github.com/hirosystems/stacks.js/commit/ca778e493e4b8651b0db896a469617be65139b30))
* offload ramdombytes library from transactions ([c06e5b8](https://github.com/hirosystems/stacks.js/commit/c06e5b838fe42c376b9347f486393ea31bc54ddb))
* remove unused dependency ramdombytes from wallet-sdk ([61eeb57](https://github.com/hirosystems/stacks.js/commit/61eeb57ab0b4e41838e154701165ac0fe98b760c))


### Features

* add appPrivateKeyFromWalletSalt ([#1212](https://github.com/hirosystems/stacks.js/issues/1212)) ([ac3858c](https://github.com/hirosystems/stacks.js/commit/ac3858cc0c5bd6aba0ff2c71704161bb4926e387))





# [3.4.0](https://github.com/hirosystems/stacks.js/compare/v3.3.0...v3.4.0) (2022-03-02)


### Features

* on restoreWalletAccounts, only support stxPrivateKey ([#1204](https://github.com/hirosystems/stacks.js/issues/1204)) ([1fbd30e](https://github.com/hirosystems/stacks.js/commit/1fbd30e8d1bc459efae2967ed084151e57cc90a9))





# [3.3.0](https://github.com/hirosystems/stacks.js/compare/v3.2.0...v3.3.0) (2022-02-23)


### Bug Fixes

* add preorder name command in cli ([ca76f06](https://github.com/hirosystems/stacks.js/commit/ca76f06cda82623ca48b3d623da6f2c5cb2851c6))
* add register command in cli ([85c7dd9](https://github.com/hirosystems/stacks.js/commit/85c7dd9d770aba5c6a60b8702bb57239c7fd14bc))
* use noble-secp256k1 in transaction to replace elliptic dependency ([534f1b8](https://github.com/hirosystems/stacks.js/commit/534f1b8acf5ab1267860af0d2a9f1ba19bb35303))





# [3.2.0](https://github.com/blockstack/blockstack.js/compare/v3.1.1...v3.2.0) (2022-02-02)


### Bug Fixes

* remove lodash dependency ([96b3064](https://github.com/blockstack/blockstack.js/commit/96b306446510eba33fe99665e0e02a84bca901c5))


### Features

* reduce reliance on network package ([422fda3](https://github.com/blockstack/blockstack.js/commit/422fda3cd43e16ae24ea9d97297b423a90823672))





## [3.1.1](https://github.com/blockstack/blockstack.js/compare/v3.1.0...v3.1.1) (2021-12-20)


### Bug Fixes

* key exposed in api call, closes [#1152](https://github.com/blockstack/blockstack.js/issues/1152) ([08012b2](https://github.com/blockstack/blockstack.js/commit/08012b2728f8aad0b18f751456532dceaf1108de))





# [3.1.0](https://github.com/blockstack/blockstack.js/compare/v3.0.0...v3.1.0) (2021-12-16)


### Bug Fixes

* update default core node url ([1208996](https://github.com/blockstack/blockstack.js/commit/120899670b35cca31f49daa9cc5c05a6061dc9aa))





# [3.0.0](https://github.com/blockstack/blockstack.js/compare/v2.0.1...v3.0.0) (2021-11-30)


### Bug Fixes

* add custom bigint pow to prevent transpilers incorrect conversion ([f0334cf](https://github.com/blockstack/blockstack.js/commit/f0334cf8581bc5aced724e8f151a826018e0f3f8))
* avoid use of getters to enable safer serialization ([6f626a1](https://github.com/blockstack/blockstack.js/commit/6f626a120229632ee215f28bc5d2ebaa40857c43))
* bigint -> number ([78c7960](https://github.com/blockstack/blockstack.js/commit/78c79600c1a0b7fde1af689f83a0c63f94d036aa))
* check if spending condition has too many sigs ([6ad03fd](https://github.com/blockstack/blockstack.js/commit/6ad03fd15e218647299e44a40616501f5b8f4f91))
* cli add missing clarity types in contract call ([a02665a](https://github.com/blockstack/blockstack.js/commit/a02665ad38cbf49e79dc315d97b23b766886eae0))
* endpoint response type ([647833a](https://github.com/blockstack/blockstack.js/commit/647833a0ca3f61d1ce549155c94c2d2127dff772))
* fix etags deletion from localstorage on parallel calls to delete file ([1af7a18](https://github.com/blockstack/blockstack.js/commit/1af7a18b1017981f5b44c1006d940eb4648d0491))
* github action for generating updated docs on release ([6d9ff4d](https://github.com/blockstack/blockstack.js/commit/6d9ff4df00469bb1015e031bb04cc3423357de5b))
* improve signOrigin oversign check; fields which are not a MessageSignature don't count in overlap check ([abe2909](https://github.com/blockstack/blockstack.js/commit/abe29096f682abb327a8134a5d4d0e7d6e20d5dc))
* jsdom failing with init bigint ([ba4d351](https://github.com/blockstack/blockstack.js/commit/ba4d3511ae023afc325faece1a4faf7a154806cb))
* **network:** upgrade and republish ([f061612](https://github.com/blockstack/blockstack.js/commit/f0616128699bf5634c4f0e93f913b41921e908ba))
* remove circular dependencies form keychain package ([140f62d](https://github.com/blockstack/blockstack.js/commit/140f62ddbf56b6aeca30198164a3b2dde26fa41b))
* remove circular dependencies from cli ([4a29e42](https://github.com/blockstack/blockstack.js/commit/4a29e42ceae7c0c4bde52d2827e234ebac2548ea))
* remove circular dependencies from transactions ([0d0b5fb](https://github.com/blockstack/blockstack.js/commit/0d0b5fbddea4cb5e64c62481cea6feb904b583a9))
* remove circular dependencies from wallet-sdk ([e9e626d](https://github.com/blockstack/blockstack.js/commit/e9e626d8b3b4dbfab6c39701e8b29fb6f3131ad3))
* return correct signature in sponsored spending conditions ([e83cdc6](https://github.com/blockstack/blockstack.js/commit/e83cdc64a215f393d75808934c8bb747f8770acb))
* review and update bns readme ([3d36f8e](https://github.com/blockstack/blockstack.js/commit/3d36f8ed2cf0387e6b39995178dcc7e9d2952755))
* review and update cli readme ([ae8c7f7](https://github.com/blockstack/blockstack.js/commit/ae8c7f7285291b48799e784b34d13e5220e0b4be))
* review and update encryption readme ([79735f4](https://github.com/blockstack/blockstack.js/commit/79735f44b8f5489a2840f146b4a168f46a34609f))
* review and update keychain readme ([a834742](https://github.com/blockstack/blockstack.js/commit/a834742f72fffe63bc89a1745be87788dd6d098d))
* review and update profile readme ([227b25a](https://github.com/blockstack/blockstack.js/commit/227b25a9f7821e986e6a8aa9afd958ec0a35c437))
* review and update stacking readme ([d4bc99e](https://github.com/blockstack/blockstack.js/commit/d4bc99e4cdb3ad59932d1627d971da9416e252c3))
* review and update storage readme ([d9df8f5](https://github.com/blockstack/blockstack.js/commit/d9df8f506c5fb5ead427d3717b320f8ee7ce673c))
* review and update transactions readme ([0421590](https://github.com/blockstack/blockstack.js/commit/0421590c84fda94ae22f78e12076b9dd7533201f))
* throw error if authType not set ([8ae3f34](https://github.com/blockstack/blockstack.js/commit/8ae3f34ce5c75236c4aeec56de2a991509cfcc13))
* trigger workflows on external pull requests [#1114](https://github.com/blockstack/blockstack.js/issues/1114) ([8b4fdb5](https://github.com/blockstack/blockstack.js/commit/8b4fdb5bdf5e14f80e8c8169d3d281a6940ba087))
* update getFee usage in stacking lib ([34dab52](https://github.com/blockstack/blockstack.js/commit/34dab525304426e0a0d594eb46968541900fad7c))
* update readme for broadcastTransaction ([c575ee9](https://github.com/blockstack/blockstack.js/commit/c575ee9ee8645fea646da0ea17dabe3f2aff85af))
* update test and fix oversign check ([a26898e](https://github.com/blockstack/blockstack.js/commit/a26898e3c6e10c779e9e4d96125241c7f412e223))


### Features

* add address/signer verification to verifySingleSig() ([589b14d](https://github.com/blockstack/blockstack.js/commit/589b14df3ae6454c202e56e60ff90bd4294c07d8))
* add more spending condition tests ([930f34d](https://github.com/blockstack/blockstack.js/commit/930f34d3d23f24e7c849593d50a1bf469d068986))
* add unsigned equivalent of make contract deploy ([792c2ae](https://github.com/blockstack/blockstack.js/commit/792c2ae615a1cd2dca4104b1da22293e7b2381f2))
* add verifyMultiSig() ([0378747](https://github.com/blockstack/blockstack.js/commit/03787470ffbf87673cda7d2a9d13581992376491))
* bring back cli command get_app_keys ([f7d2c6c](https://github.com/blockstack/blockstack.js/commit/f7d2c6c474146d6a7129b91ffac7f3e62802ceba))
* ci job to list circular dependencies ([9816b3c](https://github.com/blockstack/blockstack.js/commit/9816b3c7ae4e9a8f7fcff219239f8b6952f70471))
* cli add custom derivation path option ([9ba53be](https://github.com/blockstack/blockstack.js/commit/9ba53be4dd0cc09286a525017553218f8e5870b2))
* construct TransactionSigner with partially signed multi-sig transaction ([0ada72a](https://github.com/blockstack/blockstack.js/commit/0ada72aaeaa66ade8c01243feb50ac2aab7a6e0e))
* construct TransactionSigner with partially signed multi-sig transaction ([c0ae13f](https://github.com/blockstack/blockstack.js/commit/c0ae13fdbd49dd2034475c59952b4c9f2a595152))
* export user app file url from storage ([28d5187](https://github.com/blockstack/blockstack.js/commit/28d5187c836318876a0115da8264ab8b66509f95))
* multisig spending condition tests use integers, not BigNums ([e34ba2e](https://github.com/blockstack/blockstack.js/commit/e34ba2e76fabccb77b39d329bcc75bdac2b93b3e))


## [2.0.1](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.2...v2.0.1) (2021-08-09)

**Note:** Version bump only for package stacks.js





## [2.0.1-beta.2](https://github.com/blockstack/blockstack.js/compare/v2.0.1-beta.1...v2.0.1-beta.2) (2021-08-06)


### Bug Fixes

* fix coreNode error when fetching public data with no user session ([144754b](https://github.com/blockstack/blockstack.js/commit/144754b80f05bff1a4656be87d4ab09b4076d37c))





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
* make `lookupProfile` work with newest stacks API ([598ce15](https://github.com/blockstack/blockstack.js/commit/598ce158e51e133c25a8f5d1822567310c133739))
* updated downstream dependencies ([c636819](https://github.com/blockstack/blockstack.js/commit/c636819ae20315b4f232beb15044641689288396))
* debugging jest tests from any cwd ([626c5fc](https://github.com/blockstack/blockstack.js/commit/626c5fccb4dff213f000923ab69c7ed4f5eb48a0))
* **keychain:** do not use default import ([3528b65](https://github.com/blockstack/blockstack.js/commit/3528b6509ef69b2cb70d734fb15e3d4ad2a1f8e3))
* correct version when converting address in auth verification ([71202b4](https://github.com/blockstack/blockstack.js/commit/71202b40513fa0d2e7d85b6d6b8bfa8cbde5560f))
* support multiple lookup URLs for auth verification ([93ad6e1](https://github.com/blockstack/blockstack.js/commit/93ad6e192b917c90a5ef3031ad344b67b400c7ea))
* use only mainnet URLs during auth BNS checks ([1434262](https://github.com/blockstack/blockstack.js/commit/1434262dd5ff34b8ef837fa33c4219eac57d0436))
* use registrar for fallback, avoid duplicate lookups ([1dde71f](https://github.com/blockstack/blockstack.js/commit/1dde71f07a78bdafdb35015950cdc9b72e8ead7c))
* version of network in auth package ([e0ab244](https://github.com/blockstack/blockstack.js/commit/e0ab2446a6bddda49e915b1c2e95f35b35449597))


### Features

* add @stacks/wallet-sdk package ([49783f9](https://github.com/blockstack/blockstack.js/commit/49783f9713e7a016909f76ab816fdd486d22daae))
* add regtest to list of available networks ([f572477](https://github.com/blockstack/blockstack.js/commit/f572477ca0e5bc5e862c8a4e2fcc276655ee55a3)), closes [#1041](https://github.com/blockstack/blockstack.js/issues/1041)
* refactor all js `number` and `bn.js` usages in Clarity integer values to native bigint ([1f78339](https://github.com/blockstack/blockstack.js/commit/1f783397e7f5b38aabb6e0342af71b58022aed4c))
* allow nested concrete ClarityValue types to be specified ([da68307](https://github.com/blockstack/blockstack.js/commit/da68307499114de106f8fa5b4171580461997824))
* remove default anchormode from tx builders ([768cc57](https://github.com/blockstack/blockstack.js/commit/768cc57ddfbabfabaa4138e6aba71a131f38f229))
* function to convert pox address details to a btc address ([b6ae9ef](https://github.com/blockstack/blockstack.js/commit/b6ae9efea30e14950ae65e290e229a1ea9ebfc3a))
* support parsing btc address from a Clarity tuple value ([cb06f12](https://github.com/blockstack/blockstack.js/commit/cb06f12ea2080f0ef024d994bff4559edfb2455b))
* use lerna hoisting for fast monorepo bootstrapping ([cfd76ab](https://github.com/blockstack/blockstack.js/commit/cfd76abe7819c23489721120be0c7f712b932d96))
* match authResponse username with 2.0 bns lookup ([d40efe3](https://github.com/blockstack/blockstack.js/commit/d40efe395d07e329bd74c84049bb8443452cd432))



## [1.4.1](https://github.com/blockstack/blockstack.js/compare/v1.4.1-alpha.0...v1.4.1) (2021-04-20)
**Note:** Version bump only for package stacks.js


## [1.4.1-alpha.0](https://github.com/blockstack/blockstack.js/compare/v1.4.0-alpha.0...v1.4.1-alpha.0) (2021-04-15)


### Bug Fixes

* git rid of unnecessary 0x prefix when hashing + salting ([afd9058](https://github.com/blockstack/blockstack.js/commit/afd9058db5050859956b9ad83a2c8af5815ba7a2))



# [1.4.0-alpha.0](https://github.com/blockstack/blockstack.js/compare/v1.3.5...v1.4.0-alpha.0) (2021-04-12)


### Bug Fixes

* **cli:** add typescript as dependency ([2bec5d4](https://github.com/blockstack/blockstack.js/commit/2bec5d43976ad11c622db1a9a314d9c4e9310ac2)), closes [#964](https://github.com/blockstack/blockstack.js/issues/964)
* **cli:** support testnet address in convert_address ([aa338c3](https://github.com/blockstack/blockstack.js/commit/aa338c31cfed6cba6d1b382d29db179a26ff88cf))
* price functions ([a79c5e8](https://github.com/blockstack/blockstack.js/commit/a79c5e86d20d7ba5b7928ef0472bb77fd43eb09e))
* promise resolve type ([403b14e](https://github.com/blockstack/blockstack.js/commit/403b14edf53e89cd6df8ede68a259dd22a6b0996))
* remove .toString() ([0fa14e2](https://github.com/blockstack/blockstack.js/commit/0fa14e2b7a8ef70652418d1a9b77c6fbb38e0fdc))
* throw error if unexpected chainID ([e164ae3](https://github.com/blockstack/blockstack.js/commit/e164ae3c63c85b04707e67b234b57075a811730d))
* typos ([011f379](https://github.com/blockstack/blockstack.js/commit/011f379dfa61138c94f493c800d97822bb750695))
* typos ([cea7aac](https://github.com/blockstack/blockstack.js/commit/cea7aac4de36c61021ad1ca4ee673ad8c76bffcd))
* update BNS contract address ([ca5e5bf](https://github.com/blockstack/blockstack.js/commit/ca5e5bf4699543e17f7c494f1e72e23e0c659c18))
* update BNS contract call functions ([bf855e7](https://github.com/blockstack/blockstack.js/commit/bf855e7870e5443c2f21dd62d645d7bb5e06303e))
* validate with abi, hash zonfiles ([bccd9b5](https://github.com/blockstack/blockstack.js/commit/bccd9b5dd1801a77ff15836a89bc477410e520f5))


### Features

* add BNS package ([6eb16cc](https://github.com/blockstack/blockstack.js/commit/6eb16ccaaf497b7a6705983078e4667aa8f04cf9))
* **cli:** add WIF format to make_keychain ([73fea0d](https://github.com/blockstack/blockstack.js/commit/73fea0dfb9c8b695249c59a88caae31a16c9f484)), closes [#938](https://github.com/blockstack/blockstack.js/issues/938)
* get name and namespace price in bns lib ([e5f53b0](https://github.com/blockstack/blockstack.js/commit/e5f53b0f2fa62f6ea63554786d250df80fc6a695))
* update rest of functions that expect attachment ([d6f64b3](https://github.com/blockstack/blockstack.js/commit/d6f64b3d8f59d54f3c9731701ebcf28c64c7bee0))
* util for zonefile hash ([eaa1fce](https://github.com/blockstack/blockstack.js/commit/eaa1fcec61b98950424a0eb0606645a0912aa3ae))



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


## [1.3.1](https://github.com/blockstack/blockstack.js/compare/v1.3.0...v1.3.1) (2021-03-10)
**Note:** Version bump only for package stacks.js


# [1.3.0](https://github.com/blockstack/blockstack.js/compare/v1.2.4...v1.3.0) (2021-03-08)


### Features

* add hex string and Buffer support to `deserializedTransaction` ([be379b2](https://github.com/blockstack/blockstack.js/commit/be379b257a31329618e5e9db91e25bbe3bef1b61))
* properly serialize uncompressed auth fields ([e259fe1](https://github.com/blockstack/blockstack.js/commit/e259fe176478c3ae35f1d12d9f77be377c167f65))



## [1.2.4](https://github.com/blockstack/blockstack.js/compare/v1.2.3...v1.2.4) (2021-02-26)
**Note:** Version bump only for package stacks.js


## [1.2.3](https://github.com/blockstack/blockstack.js/compare/v1.2.2...v1.2.3) (2021-02-25)


### Bug Fixes

* don't multiply with cycleDuration ([a6fab4e](https://github.com/blockstack/blockstack.js/commit/a6fab4e5c3038cf4eaa7bd997b7d4c5104ca6858))
* export cvToValue function ([835e68e](https://github.com/blockstack/blockstack.js/commit/835e68e14e346c2417ac21c1c85bdc68d3de6e2e))
* getDelegateStxOptions ([42eea7e](https://github.com/blockstack/blockstack.js/commit/42eea7ec9da23fae67ea8499e0db51665acffe0e))
* ignore .html files ([e2d5810](https://github.com/blockstack/blockstack.js/commit/e2d58100359b705db4eed680e03116626db3b7cd))
* prettier ([f09f446](https://github.com/blockstack/blockstack.js/commit/f09f4462d887f3dc9684d0d861e8a56c44fb88fe))
* prettier in tx lib ([404d917](https://github.com/blockstack/blockstack.js/commit/404d9178e780b8a42e46767a3556dfff9700ff5f))
* run prettier ([857e342](https://github.com/blockstack/blockstack.js/commit/857e342fd8a69f2d3dfa3d93698790bb33123977))
* run prettier ([6a1caae](https://github.com/blockstack/blockstack.js/commit/6a1caaed6818f60a2d838c1b4dabc902d168be72))



## [1.2.2](https://github.com/blockstack/blockstack.js/compare/v1.2.2-alpha.0...v1.2.2) (2021-02-16)
**Note:** Version bump only for package stacks.js


## [1.2.2-alpha.0](https://github.com/blockstack/blockstack.js/compare/v1.2.1-alpha.0...v1.2.2-alpha.0) (2021-02-16)
**Note:** Version bump only for package stacks.js


## [1.2.1-alpha.0](https://github.com/blockstack/blockstack.js/compare/v1.2.0...v1.2.1-alpha.0) (2021-02-16)
**Note:** Version bump only for package stacks.js


# [1.2.0](https://github.com/blockstack/blockstack.js/compare/v1.1.0...v1.2.0) (2021-02-15)


### Bug Fixes

* export postcondition serialize ([39bc470](https://github.com/blockstack/blockstack.js/commit/39bc470cfa554bc73d96e564a1f373a8dd26e8d6))
* make_keychain help description ([edd0551](https://github.com/blockstack/blockstack.js/commit/edd055159786c8a7cae757b9dfcf85ab04f2a3de))
* versions out of sync with lerna ([56e6438](https://github.com/blockstack/blockstack.js/commit/56e643869555c4752713a50e54c67c3f1671f6f5))


### Features

* add attachment arg to broadcastTransaction() ([f75f250](https://github.com/blockstack/blockstack.js/commit/f75f250a86789a8d1a6f5a09842ff81bfa345b96))
* use lodash assign ([3d200e7](https://github.com/blockstack/blockstack.js/commit/3d200e7f67cf1e2abeca5adac787a22bbb0b2c49))



# [1.1.0](https://github.com/blockstack/blockstack.js/compare/v1.0.2...v1.1.0) (2021-01-29)


### Bug Fixes

* lint, docs, and updates after merging master ([1206ab5](https://github.com/blockstack/blockstack.js/commit/1206ab534e596d1860b1a7defbba3af632c1ca2b))
* set node version in master CI checks ([a7e2ec6](https://github.com/blockstack/blockstack.js/commit/a7e2ec68246c2b6c6cffd10df4a5be78c0bd0e75))
* updates based on feedback ([ba15c2f](https://github.com/blockstack/blockstack.js/commit/ba15c2f296a1b268b5aef9bfeb8f590492388a2d))


### Features

* add delegate methods ([5b9a3ed](https://github.com/blockstack/blockstack.js/commit/5b9a3edb406197c3b88917461f1ec3634f07c83e))



## [1.0.2](https://github.com/blockstack/blockstack.js/compare/v1.0.1...v1.0.2) (2021-01-28)


### Bug Fixes

* check okay before parsing result ([952a60d](https://github.com/blockstack/blockstack.js/commit/952a60d95fe640718410ae14f981e7da98f1201a))
* CLI reference syntax error ([868ae4d](https://github.com/blockstack/blockstack.js/commit/868ae4dcd6d8ba5b93954947e61dba4d1953345c))
* CLI tx response explorer URL and update reference doc ([535c683](https://github.com/blockstack/blockstack.js/commit/535c68313da520b6678d4ca93accfcd4447ac2d9))
* lint ([cd90d8c](https://github.com/blockstack/blockstack.js/commit/cd90d8c2098cb2a018156a8af60274a9e8fde73d))
* name lookup url not working on mainnet, fixes [#916](https://github.com/blockstack/blockstack.js/issues/916) ([fc554cd](https://github.com/blockstack/blockstack.js/commit/fc554cd816c58b6912ff225b1443457c13455013))
* remove unused imports ([aeb10b2](https://github.com/blockstack/blockstack.js/commit/aeb10b22a15c671ecddb6a81ff9e1781b1b331f9))
* **stacking:** fix "Assertion failed" error when calling `.stack` and `.canStack` ([9093ce5](https://github.com/blockstack/blockstack.js/commit/9093ce54e701d5b30378ca5e0b8e82dd30982cf3))
* throw error on error response ([0a9a1ee](https://github.com/blockstack/blockstack.js/commit/0a9a1eed312d68b4d0b31bc3bb5dfc7143e10057))
* update explorer URLs ([d691c09](https://github.com/blockstack/blockstack.js/commit/d691c098f9b37db15253869e59829c597b1cfd0b))


### Features

* add stale bot config ([2045dc7](https://github.com/blockstack/blockstack.js/commit/2045dc78427ced27d54b16418f97f8d4e36d332c))
* improve `StackerInfo` type ([98e43fe](https://github.com/blockstack/blockstack.js/commit/98e43fe9588e52c1180b68211b2907ad47d93ae7))
* move CI tests to github actions ([18a8674](https://github.com/blockstack/blockstack.js/commit/18a8674012081afdcd85eec091672c48b6f8a26a))



## [1.0.1](https://github.com/blockstack/blockstack.js/compare/v1.0.0...v1.0.1) (2021-01-15)


### Bug Fixes

* cli - update urls for stacks 2 ([57398c4](https://github.com/blockstack/blockstack.js/commit/57398c41bb0d8b4dc9c9cd8146e5d276cb5c0845)), closes [#908](https://github.com/blockstack/blockstack.js/issues/908)



# [1.0.0](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.20...v1.0.0) (2021-01-14)


### Bug Fixes

* **keychain:** typing reference ([251383a](https://github.com/blockstack/blockstack.js/commit/251383aef1abd0ed8cdae76829776733e0df026f))
* package.json to reduce vulnerabilities ([26af134](https://github.com/blockstack/blockstack.js/commit/26af134b424a2e9eaef10f68473d4482bebf93c4))
* unit test urls ([2faebb7](https://github.com/blockstack/blockstack.js/commit/2faebb73769147feb7bc3effb3cbc09617309de1))
* update axios dependency version ([5c67546](https://github.com/blockstack/blockstack.js/commit/5c67546cb567b40c1efae7c0edb69ca3c97066a3))
* update cross-fetch to v3.0.6 ([50e4292](https://github.com/blockstack/blockstack.js/commit/50e42925d2aa549db9b1dc3a3af75ef7e7e13c15))


### Features

* better readme docs ([1fc9262](https://github.com/blockstack/blockstack.js/commit/1fc92620b2a53168e1a98c08b33ec0c6c7d8d217))
* update to mainnet urls ([52c453a](https://github.com/blockstack/blockstack.js/commit/52c453a7f6b01bdec9518cbde4d5b0787ef71f51))



# [1.0.0-beta.20](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.18...v1.0.0-beta.20) (2020-12-10)


### Bug Fixes

* add handling of trait_reference ([b404135](https://github.com/blockstack/blockstack.js/commit/b404135c9f6035c1473bceb60afd869803ba35b2))
* export cvToJSON ([28c91f8](https://github.com/blockstack/blockstack.js/commit/28c91f8426722f6384501e7ceb60bff2fac8ae8a))
* include yarn.lock ([23e1dfa](https://github.com/blockstack/blockstack.js/commit/23e1dfa745d493ad511e6b434d2b2896c5ef7e33))
* re-add ignore etag bool ([c29e68d](https://github.com/blockstack/blockstack.js/commit/c29e68dff37e7691c45b0f624108712690596a3d))
* remove duplicate text, add helper function docs ([b9856f6](https://github.com/blockstack/blockstack.js/commit/b9856f67b42235cecbad82f32fb125d27a32b34a))
* remove extra comma ([84d09f6](https://github.com/blockstack/blockstack.js/commit/84d09f6dcad3e36ea53b14140a30aab6c2570017))
* return object instead of array ([1901505](https://github.com/blockstack/blockstack.js/commit/19015053f128463c5ae172a52e66d6850e022119))
* use correct response type ([b5bd3da](https://github.com/blockstack/blockstack.js/commit/b5bd3dae8b34e5f97677eb64d4fbb0d38d6e326b))


### Features

* add cvToJSON ([36e2138](https://github.com/blockstack/blockstack.js/commit/36e21388fc9e313a40c92257d2fb44755792e93a))
* undo export connect from auth ([233df70](https://github.com/blockstack/blockstack.js/commit/233df707f7e60106275233bbb8861fdd52e8104f))



# [1.0.0-beta.18](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.13...v1.0.0-beta.18) (2020-12-03)


### Bug Fixes

* cli stacking status response ([b5175ac](https://github.com/blockstack/blockstack.js/commit/b5175acf6317bad37d2cd7e38d8e2c928c12d2af))
* correct tsconfig for dev ([737154f](https://github.com/blockstack/blockstack.js/commit/737154f4af35dd41c09e4e5fb6060b7aefe5ae86))
* lint ([a3a1abd](https://github.com/blockstack/blockstack.js/commit/a3a1abdfab2de1363658a26a0f38570e89407e62))
* lint ([427f3a7](https://github.com/blockstack/blockstack.js/commit/427f3a7e6c83a3c0a3472d9a170583a02e12f9c7))
* merge artifact ([a6b7da0](https://github.com/blockstack/blockstack.js/commit/a6b7da0586caa893c7cdf2ef4a3011de3248afe8))
* missing stacking lib dep ([0027f7e](https://github.com/blockstack/blockstack.js/commit/0027f7ed90a6dbfd71608076adb5a206582bdfb8))
* missing stacks-blockchain-api dependency for cli ([d4e01e0](https://github.com/blockstack/blockstack.js/commit/d4e01e018ecaa38d8babea748521db621fb04c47))
* remove ts-ignore ([48d2109](https://github.com/blockstack/blockstack.js/commit/48d2109f885a208957bfc2231201cb24f03cd0e5))
* remove typing path to non-existant directory ([55157cc](https://github.com/blockstack/blockstack.js/commit/55157cc7017cda62460594243301ae64393c49da))
* stacking lib minimum balance check ([7909d2f](https://github.com/blockstack/blockstack.js/commit/7909d2f699c33575d10fe1b7501b34a212197cf2))


### Features

* add unlock block to stacking status CLI command ([ae3bbc0](https://github.com/blockstack/blockstack.js/commit/ae3bbc0f12755e4ef2623d1d904481248a8d15e4))
* stacking support in CLI ([5398b8f](https://github.com/blockstack/blockstack.js/commit/5398b8f68fac4cfb799c6982740e930ae60fae50))
* stacking support in CLI ([120f3e3](https://github.com/blockstack/blockstack.js/commit/120f3e38355827a4d457c75e654c888f830eecb0))
* update for stacking lib ([9462d7e](https://github.com/blockstack/blockstack.js/commit/9462d7ea08138d187ada6347fe6ec94b64ec0ff0))



# [1.0.0-beta.13](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.12...v1.0.0-beta.13) (2020-11-25)


### Bug Fixes

* update stacking status response ([3dc086b](https://github.com/blockstack/blockstack.js/commit/3dc086bf439eeb7a5f28a0270c5ed9bd9cbfe4c4))



# [1.0.0-beta.12](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.11...v1.0.0-beta.12) (2020-11-20)


### Features

* export transactions/authorization ([8e55e7a](https://github.com/blockstack/blockstack.js/commit/8e55e7ad5e157f783e8aa1cfd42d8306e0bc3233))
* export transactions/utils ([c9fabc4](https://github.com/blockstack/blockstack.js/commit/c9fabc4b08a484ee015b549579a50d96f94348c4))
* expose readBigUInt64BE ([395bcd9](https://github.com/blockstack/blockstack.js/commit/395bcd9296ad0345ac956fe8712894bc5d4268eb))
* more BufferReader passthroughs ([ff4204f](https://github.com/blockstack/blockstack.js/commit/ff4204f3df48913026633819843da990f67dad68))



# [1.0.0-beta.11](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.10...v1.0.0-beta.11) (2020-11-20)


### Bug Fixes

* address stacking lib feedback ([61f5bb8](https://github.com/blockstack/blockstack.js/commit/61f5bb864161603599d17216371e8e0caf46cf38))
* build docs ([ad5b344](https://github.com/blockstack/blockstack.js/commit/ad5b3444e8ac224164775eeef9b663e319ccc5a7))
* stacking status unlock height calculation ([ccf795a](https://github.com/blockstack/blockstack.js/commit/ccf795a3a92a0fe7342167e5c3656ab40f811348))
* update readme ([78ec72d](https://github.com/blockstack/blockstack.js/commit/78ec72d0f2631a1c6d2c6fe8a5df608e83c14775))
* use https for default testnet node ([43b2886](https://github.com/blockstack/blockstack.js/commit/43b2886b9df68ffd2fe8c93330360276cf9bb894))


### Features

* additional info API for stacking ([da50fa0](https://github.com/blockstack/blockstack.js/commit/da50fa094dcedd8cc83272c62bef84bbabe1e876))
* improve stacking getStatus response ([b2e0a37](https://github.com/blockstack/blockstack.js/commit/b2e0a37b4624f34427d08acf13c8bbcb8d473ddc))
* improved stacking lib API and unit tests ([7ec3f06](https://github.com/blockstack/blockstack.js/commit/7ec3f06d259a09f83df4bf2b824f0a33001d5f5b))
* stacking lib ([665a024](https://github.com/blockstack/blockstack.js/commit/665a0240a116e9fd388c66c81366a1cde6130254))
* stacking lib readme ([83c78f4](https://github.com/blockstack/blockstack.js/commit/83c78f4c99876bcf634c0c114fc0d2c5c5a462d7))
* unlock block in stacking status func ([c3b97a7](https://github.com/blockstack/blockstack.js/commit/c3b97a7fdfd3c39e8e4fe2942f2c094667a392ca))
* update testnet node URL ([ef54dff](https://github.com/blockstack/blockstack.js/commit/ef54dff652d10b0602de17e062fd161cdfc49a16))



# [1.0.0-beta.10](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.9...v1.0.0-beta.10) (2020-11-17)


### Bug Fixes

* change readme links to absolute ([b149074](https://github.com/blockstack/blockstack.js/commit/b1490744e90cb076b971bbfd3f2a201ccff90b65))
* export NoneCV and SomeCV ([974b0c7](https://github.com/blockstack/blockstack.js/commit/974b0c7b4b782faf1e4f5a8b5a73a9f5c57396c3))
* remove class extension of smartbuffer to fix build issues ([9ccb417](https://github.com/blockstack/blockstack.js/commit/9ccb417395ed99df83d143d0fa5bcff1c611b0db))



# [1.0.0-beta.9](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.8...v1.0.0-beta.9) (2020-11-06)


### Bug Fixes

* clean up package.json ([0559d3e](https://github.com/blockstack/blockstack.js/commit/0559d3e5edbfb39a80833e8b936ec310bd983375))
* missing keychain dep ([329fdac](https://github.com/blockstack/blockstack.js/commit/329fdacf7fe38925dc2d5a84d01816926b1544fd))
* remove blockstack.js and legacy transaction lib dependency from keychain ([c9c4f77](https://github.com/blockstack/blockstack.js/commit/c9c4f7742865e9dbb16425c241acdd0e3f3bde29))
* switch to @stacks/connect ([eca6f4c](https://github.com/blockstack/blockstack.js/commit/eca6f4c67569ac71198c8a09955a992feff2aa68))


### Features

* export connect from auth package ([3149768](https://github.com/blockstack/blockstack.js/commit/3149768d63d284eabaf917ba9a8f134f8254a835))
* **transactions:** more exports ([c335bb0](https://github.com/blockstack/blockstack.js/commit/c335bb0ba6a1b1cf26234234d1c04674a29bab02))



# [1.0.0-beta.8](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2020-10-27)


### Bug Fixes

* change default buffer encoding to hex in cvToString() function ([92af5b5](https://github.com/blockstack/blockstack.js/commit/92af5b54e3f812fb9d6ad795bb33a5e291aa15ab))
* CLI unable to specify node URL ([f8403f0](https://github.com/blockstack/blockstack.js/commit/f8403f01486041a73157efe0d197caa3af4b4240))
* no clone on tx broadcast result ([c12e369](https://github.com/blockstack/blockstack.js/commit/c12e36923b187bd3889c9b713e2be28561ad04ed))


### Features

* add mocknet network config ([fca6bb5](https://github.com/blockstack/blockstack.js/commit/fca6bb5c538bd3511f0d8a5baaaec5f6099a8639))
* enable creation of unsigned contract calls ([ba2243e](https://github.com/blockstack/blockstack.js/commit/ba2243ee7944780b79b1e22c12778ffd0f0bc388))
* **transactions:** export cvToHex, hexToCV, parseReadOnlyResponse ([1c0f0e3](https://github.com/blockstack/blockstack.js/commit/1c0f0e3f31f0849f02762c7422d1f7c22aebe22b))



# [1.0.0-beta.7](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2020-10-15)



# [1.0.0-beta.6](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2020-10-15)


### Bug Fixes

* clean up dependencies ([442bc3d](https://github.com/blockstack/blockstack.js/commit/442bc3d6d302e5cb4fb15db7467d77d660a1947e))
* prepend txid with 0x in CLI ([6c85a52](https://github.com/blockstack/blockstack.js/commit/6c85a526919f6ee4b606d027461f950cfbba187d))
* remove unused bitcoinjs-lib dependency from common lib ([9899890](https://github.com/blockstack/blockstack.js/commit/989989096b318a27023c406882dc83592e4e8a62))



# [1.0.0-beta.5](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2020-10-15)


### Bug Fixes

* add entries in package.json ([12eaf53](https://github.com/blockstack/blockstack.js/commit/12eaf53b9a344415d975020f23fc49d4fdd18023))
* cli build errors ([9cdf5e2](https://github.com/blockstack/blockstack.js/commit/9cdf5e234f601548d2cd1acbf09a6db7f8b18ac8))
* cli build fixes ([65f71ac](https://github.com/blockstack/blockstack.js/commit/65f71ac10176b792f55219db53f9e7af3aaa7776))
* cli error with extending BlockstackNetwork class ([ad13e46](https://github.com/blockstack/blockstack.js/commit/ad13e4617d703c5e543c4a068802ea69c80a7ef4))
* cli running ([b2bfe1c](https://github.com/blockstack/blockstack.js/commit/b2bfe1c6beb6e1954b01e7935ce417dad08437b8))
* keychain tests failing in ci ([1cfe263](https://github.com/blockstack/blockstack.js/commit/1cfe263b714498a8a9dd40b085b471c6001c00e6))
* keychain tests failing in ci ([0bc9d38](https://github.com/blockstack/blockstack.js/commit/0bc9d3875c3a09321e07a201188775f8125086e0))
* package-lock conflicts ([e1e1300](https://github.com/blockstack/blockstack.js/commit/e1e1300a24b80b50c0435e3b31f81ea3d4186826))
* syntax in migration guide ([d75429f](https://github.com/blockstack/blockstack.js/commit/d75429ffd73167badd7832aac378e454f8dfa533))
* tx broadcast error msgs ([df60924](https://github.com/blockstack/blockstack.js/commit/df60924f3f9f8ec8a2cc8d8e3aaec36841ef776b))



# [1.0.0-beta.2](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2020-10-06)



# [1.0.0-beta.4](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2020-10-09)


### Bug Fixes

* issue with jest version ([ccd5f00](https://github.com/blockstack/blockstack.js/commit/ccd5f00d7413eb1a4a9446b908372ecb3a13c64e))
* package.json files ([0f607c9](https://github.com/blockstack/blockstack.js/commit/0f607c944daa6b1d6701c601ff06fadb1dfa58cb))
* restore protocolEchoDetection ([c48d118](https://github.com/blockstack/blockstack.js/commit/c48d118d5764bba49558d5058f333c405cf5efec))



# [1.0.0-beta.3](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2020-10-09)


### Bug Fixes

* auth package tests ([59f17de](https://github.com/blockstack/blockstack.js/commit/59f17de4430edad737222f86bdf8be21cd1c587c))
* eslint, yarn workspaces ([9a6ad14](https://github.com/blockstack/blockstack.js/commit/9a6ad14c6d59dfe715dc5f822b40ebfe7be7ee62))
* lint prettier all packages ([17fc891](https://github.com/blockstack/blockstack.js/commit/17fc89109597763f81cda7a29bd32ea08f8eae5a))
* transaction lib build ([86829fe](https://github.com/blockstack/blockstack.js/commit/86829fe5eadbbe3fe1345234567b1d10e88c1b5b))
* transactions package tests ([da29e8e](https://github.com/blockstack/blockstack.js/commit/da29e8e9ff46b5d2535cbe9a111b152444299a97))


### Features

* build update for common, encryption and storage packages ([fd71e71](https://github.com/blockstack/blockstack.js/commit/fd71e71de4c44cac159d305b651a164ef217ae8b))



# [1.0.0-beta.2](https://github.com/blockstack/blockstack.js/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2020-10-06)


### Bug Fixes

* dep versions not bumped to beta ([c195003](https://github.com/blockstack/blockstack.js/commit/c19500379ac248a15c014ff9ecd63c71a167aed9))
* dep versions not bumped to beta ([cbb2835](https://github.com/blockstack/blockstack.js/commit/cbb28355ab6ea72adff95b4325582843291bf68e))


### Features

* addSignature method ([9fbc1df](https://github.com/blockstack/blockstack.js/commit/9fbc1dff80a79ce67b78eacd16222d4658ef19e3))
* codecov ([f1eb1a4](https://github.com/blockstack/blockstack.js/commit/f1eb1a4393f33331843d40be5122132829ceefe6))
* codecov ([a3d94c8](https://github.com/blockstack/blockstack.js/commit/a3d94c84a248ee49093302fe37dd7fd37dce50d9))
* codecov ([4e26fa4](https://github.com/blockstack/blockstack.js/commit/4e26fa4968357cb3081d3ebfa71c9cf71484f729))



# [1.0.0-beta.1](https://github.com/blockstack/blockstack.js/compare/v21.1.1...v1.0.0-beta.1) (2020-09-28)


### Bug Fixes

* add tsdx to packages ([fbb4281](https://github.com/blockstack/blockstack.js/commit/fbb4281755f3ca46df233a04505ad0d44df1b226))
* allow force option in putFile ([0797a5d](https://github.com/blockstack/blockstack.js/commit/0797a5d127f40611ebe3136db6625a180a6fe243))
* ci config ([3812c3f](https://github.com/blockstack/blockstack.js/commit/3812c3f1db00ca4a0ee5bff1a3df46dad2437425))
* ci config ([9d5d3f1](https://github.com/blockstack/blockstack.js/commit/9d5d3f131e0336d9e24c86c908486412ef278708))
* ci config ([77758cd](https://github.com/blockstack/blockstack.js/commit/77758cdf78312afa984ffa8568f39523235ca0ab))
* ci config ([1eb00ec](https://github.com/blockstack/blockstack.js/commit/1eb00ecb0529f260b968105792189e12f6df968e))
* cli build config ([2959c20](https://github.com/blockstack/blockstack.js/commit/2959c209931a0261ecf48f2d78bf9d8db1e43661))
* cli global install ([b088271](https://github.com/blockstack/blockstack.js/commit/b08827115b805b280811da702ceb1dd3b96c7c12))
* lint ([269bff4](https://github.com/blockstack/blockstack.js/commit/269bff49d5f10278d82ec5341d06f7b5b86268fd))
* lookup profile args in storage ([e60cf32](https://github.com/blockstack/blockstack.js/commit/e60cf32a192b912c002bc17ac6288f121adfa2be))
* merge conflict mistake ([3124e05](https://github.com/blockstack/blockstack.js/commit/3124e05ce169a5fcd531772c31f81e1c512cdec3))
* missing optional argument for input 'triplesecDecrypt' ([3aaf773](https://github.com/blockstack/blockstack.js/commit/3aaf773791fc0734d1b49c15b66b08e15e137928))
* more circular dependencies removed from auth package ([3a1dfba](https://github.com/blockstack/blockstack.js/commit/3a1dfbad852e67a8aeeafe3cad635c4a066fe4fa))
* prettier formatting ([0069bd7](https://github.com/blockstack/blockstack.js/commit/0069bd7fea7605472760159ea9af74cc8e1b1b24))
* profile package circular dependency ([c749612](https://github.com/blockstack/blockstack.js/commit/c749612c4b687410555ba46a519eaddea5c956f6))
* remove cache files from git ([9fc294e](https://github.com/blockstack/blockstack.js/commit/9fc294e046016c3b21cd3ae4bddb26c84f11831b))
* remove old tests and data from auth package ([30e446f](https://github.com/blockstack/blockstack.js/commit/30e446fa98033b33f5a316c0613eb691d6f35e14))
* remove transaction package prepare script ([f62f500](https://github.com/blockstack/blockstack.js/commit/f62f50014cf55ddcffa53c0086bd885fc2abf0f1))
* remove unused auth.ts ([9ce79f6](https://github.com/blockstack/blockstack.js/commit/9ce79f6092d56a513c878272446b2551bedde3e5))
* tests and ci ([c05e353](https://github.com/blockstack/blockstack.js/commit/c05e35368b094280cad1468fb1394a0672901cbd))
* update ci config ([a63528e](https://github.com/blockstack/blockstack.js/commit/a63528ef2205dd469c1dfa58b1e55b614e51faeb))
* update transactions package readme ([ac9b3a5](https://github.com/blockstack/blockstack.js/commit/ac9b3a558d722f83f38202a3ff346532a4bd3463))


### Features

* add cli bin.js ([6781230](https://github.com/blockstack/blockstack.js/commit/67812306cfa5c9920f058d18bde2c44d66bf831d))
* add cli src files ([e3fbb0a](https://github.com/blockstack/blockstack.js/commit/e3fbb0aae93fbe85ccc264638248274ac25d40fa))
* add keychain package ([5fbe772](https://github.com/blockstack/blockstack.js/commit/5fbe772684f980e3969b9a4d844fb792b179162f))
* add network package ([da8ec58](https://github.com/blockstack/blockstack.js/commit/da8ec583dad403208759cd25f0e923728357a98c))
* add profile package ([d27a657](https://github.com/blockstack/blockstack.js/commit/d27a6577a27b5e349695f59c87e732e40f212947))
* blockstack.js to stacks.js migration guide ([3760bf2](https://github.com/blockstack/blockstack.js/commit/3760bf277523d50ba985d9f4fa1d073e452bddd4))
* clean up legacy code ([faa3620](https://github.com/blockstack/blockstack.js/commit/faa3620f138b9225e4ff387935d43b69d6ee16d9))
* create random private key with optional entropy ([dc192d4](https://github.com/blockstack/blockstack.js/commit/dc192d46165f8df3b2a306520e1c080153e0aa8e))
* create storage package ([c99680b](https://github.com/blockstack/blockstack.js/commit/c99680b9b0e0b3265b4b47ae9c566daf8f320ab1))
* create storage package ([1867afe](https://github.com/blockstack/blockstack.js/commit/1867afe2a458d2f74cc7842ada446416cbad3072))
* move CLI package ([1608d7c](https://github.com/blockstack/blockstack.js/commit/1608d7c5b69a3a971266dbe650ab1c955a98137f))
* move encryption functions out of storage package ([cb7b293](https://github.com/blockstack/blockstack.js/commit/cb7b29355295165f7d54d788f22605b11268ae9f))
* move transactions package from @blockstack/stacks-transactions ([d31cf3c](https://github.com/blockstack/blockstack.js/commit/d31cf3cdb6c85a1e7a71c7c2ed04397617a469d8))
* persist etags in UserSession ([66ab8f1](https://github.com/blockstack/blockstack.js/commit/66ab8f1a804c2c5515cb16f5a474bac5872bd70c))
* refactor tests to use jest and move into respective packages ([e35e57e](https://github.com/blockstack/blockstack.js/commit/e35e57e972281531d11f6f7a5d9affeb780fa5dd))
* remove references to GaiaHubConfig in auth package ([f0f97de](https://github.com/blockstack/blockstack.js/commit/f0f97dee2a97b8f88dc16c879a2c1b8ec3835dd1))
* remove storage functions from user session ([c27d948](https://github.com/blockstack/blockstack.js/commit/c27d94892ccb76693b0fcda440a2358027684aa5))
* setup monorepo structure and refactor auth ([03c7c92](https://github.com/blockstack/blockstack.js/commit/03c7c928d94689475bd635fa55e0c7a8f0f0ad07))
* switch cli to @stacks/transactions ([833b748](https://github.com/blockstack/blockstack.js/commit/833b748c6470371c1717b59778b36932b7c17a28))
* update common package ([2132b08](https://github.com/blockstack/blockstack.js/commit/2132b082fcf67ecb9f2fa2644cf7b68defef322d))
* update tsconfig and use tsdx ([a82dd0c](https://github.com/blockstack/blockstack.js/commit/a82dd0c84b763e38a6128624ddf9d7ae6f134f78))
* update tsconfig and use tsdx ([01c8f82](https://github.com/blockstack/blockstack.js/commit/01c8f82f5412770de046f6c0b2b555251fd03273))
