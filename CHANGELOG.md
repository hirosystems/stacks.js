# Changelog
All notable changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [21.1.1] - 2020-08-24
### Changed
- Persist etags in UserSession store so they don't always need to be fetched when the page is loaded.

## [21.1.0] - 2020-06-05
### Changed
- Static `storage/` functions used by `UserSession` are no longer globally exported, as they are wrapped by publicly accessible `UserSession` methods. Functions that are no longer accesible are `getFileUrl`, `getFileContents`, `getFile`, `putFile`, `deleteFile`, and `listFiles`. 
- Removed various static functions that have been replaced by `UserSession` .
- Delete etags from cached `etag` map on `deleteFile` so that new files with the same name can be subsequently created.

## [21.0.0] - 2020-01-17
### Added
- More Blockstack error codes.
- `putFile` and `encryptContent` can now optionally base64 encode data, for a ~33% size increase compared to the default hex encoding which has a 100% size increase. 

### Changed
- `putFile` performs client-side validation that data size is within the Gaia hub's reported maximum limit. 
- When a `string` value is passed to `putFile` and the `contentType` option is unspecified, it is set to `text/plain; charset=UTF-8`. 
- `getFile` now throws error on 404 instead of returning null.
- `getFile`, `putFile`, `deleteFile`, `listfiles` now include error info upon failure.
- `getFile` can now decrypt using a custom private key
- Several cryptographic operations now use the native Web Crypto APIs when available. This primarily
increases the performance of file encryption and decryption, and account seed phrase encryption and 
decryption. 
- The following functions now return Promises: `handleSignedEncryptedContents`, `makeAuthResponse`, 
`encryptECIES`, `decryptECIES`, `encryptPrivateKey`, `decryptPrivateKey`, `encryptContent`, 
`decryptContent`, `aes256CbcEncrypt`, `aes256CbcDecrypt`, `hmacSha256`.
- `putfile` now prevents data corruption caused by race conditions by using etag values to verify that the client is updating the latest version of the file.
- `putFile` now attempts to include `etag` values in the `If-Match` header of its request, and sets the `If-None-Match` header to `*` if it is unaware of an etag for the file it is attempting to write.
- `putFile` now returns an `etag` in addition to the `publicURL` after successfully writing a file.
- `PreconditionFailedError` thrown if `putFile` returns with a `412` response.

## [19.4.0] - 2019-09-03
### Changed
- Excluded unused bip39 wordlist from dist bundle, reducing bundle size.

## [19.3.0] - 2019-08-21

### Changed
- Fixed deprecated crypto warning in node.js usage.
- `handlePendingSignIn` now throws an error when overwriting an existing user session. See issue #680
- Updated jsontokens library to v2.

## [19.2.2] - 2019-05-12

### Changed
- Updated bitcoinjs-lib dependency to v5 and eliminates node-gyp errors on install
- Fixed bugs when running in a web worker

## [19.2.0] - 2019-05-12

### Added
- Method `deleteFile()` is now implemented

### Changed
- Fixed return type for BlockstackNetwork.getAccountTokens
- Property `manifestURI` is now included in loaded manifest object
- The `src` directory is now included in the npm package

## [19.1.0] - 2019-03-29

### Added
- Converted codebase to Typescript
- New `dist/blockstack.js` bundle with ES2015/ES6 support
- `lib/**/*.js modules with Node v8.x support (ES2015/ES6 & CommonJS modules)

### Changed
- Fixed protocol handler detection issues with modular usage of blockstack.js

## [19.0.1] - 2019-03-12

### Added
- New function `getFileUrl()` will return a URL for reading a particular file
  from an applications' Gaia bucket.

### Changed
- Fixed the email authentication scope
- Fixed multiple bugs with `redirectToSignIn()` and `makeAuthRequest()`

## [19.0.0] - 2019-02-21

### Added

- Moved common user session related functions into `UserSession`. Session configuration is 
done through AppConfig objects. This change removes the library's dependency on browser 
environments.
- List of functions moved: redirectToSignIn(), isUserSignedIn(), isSignInPending(), 
handlePendingSignIn(), loadUserData(), signUserOut(), getFile(), putFile(), 
encryptContent(), decryptContent(), listfile(), deleteFile()
- The public API will remain backward compatible until a future release.

### Changed

- `loadUserData()` now throws an error instead of returning null if no signed in user session 
is detected

## [18.3.0] - 2019-01-29

### Changed

- New method for auth protocol handler detection. This should fix sign in flows for 
most major web browsers and operating systems with both the native browser installed and
not installed. 
- NOTE: If you're using this version of blockstack.js with an old version of the native 
browser, the app will (1) open an auth handler in the native browser and (2) also redirect 
the original tab to browser.blockstack.org. 

## [18.2.1] - 2019-01-08

### Added

- Added automatic retry logic to `putFile` in the case of a failed storage call. This might be
the case if there have been any token revokations. This new logic will catch the first failed write,
construct (and cache) a new Gaia token, and then attempt the write again. This allows tokens
to be revoked without any hiccups from a user experience standpoint.

## [18.2.0] - 2018-12-20

### Added

- Added an extra parameter to `makeAuthRequest`, called `extraParams`. This is a wildcard object, 
and all keys and values included in this argument will be included in the `payload` of
an `authRequest`.
- `authRequest` version bumped to `1.3.1` from `1.3.0`.

## [18.1.0] - 2018-10-24

### Added
- The `BlockstackWallet` class in `blockstack.js` supports generating
  private keys and addresses within the hierarchical derivation scheme
  used by the Blockstack Browser and supported by the Blockstack
  ecosystem.
- A `listFiles` function allows an application to list files in its
  Gaia storage bucket.
- In the transaction generation library, the makeTX functions now
  take an optional 'buildIncomplete' argument, allowing you to get
  a serialized transaction which hasn't been fully signed yet.
- A `blockstackAPIUrl` field to the authentication response token that overrides the default
  in `blockstack.config.network` allowing the user to specify their own Blockstack
  Core node.
- A `gaiaAssociationToken` field to the authentication response token which enables
  users to run private Gaia hubs without authorization each application address.
- An option `contentType` to the `putFile` `options` object that sets the
  Content-Type header for unencrypted data. Thanks to @muneebm for this!

### Changed
- Fixed a bug in version checking during the authentication process
  that manifested itself when signing in with apps using very old versions
  of blockstack.js.
- Default redirect URI changed from origin plus trailing slash to the
  origin. For example, app with origin `https://example.com` default
  redirect URI which was previously `https://example.com/` is
  now `https://example.com`.
- Fixed a couple bugs in the transaction generation, networking
  code. First, coerce address now correctly coerces P2SH
  addresses. Second, bitcoinjs-lib recently switched to defaulting to
  version 2 transactions, which breaks our interoperability with a handful
  of other libraries. Finally, with this comes a little bit of refactoring,
  to reduce the repeated code in the transaction libraries.
- Increments the authentication process version to 1.3 in a backwards compatible change.
- When using the bitcoind client in development networks,
  track which addresses we've already called `importaddress` with
  and do not retry.

## [18.0.4] - 2018-08-06

### Changed
- Resolve unsupported protocol error by redirecting
  to hosted authenticator on all mobile devices

## [18.0.3] - 2018-08-01

### Changed
- Resolve unsupported protocol error by redirecting
  to hosted authenticator on iOS

## [18.0.2] - 2018-07-27

### Changed
- Update `bitcoinjs-lib` to version 4.0.0.

## [18.0.1] - 2018-07-27

### Changed
- Switched from `cross-fetch` to `cross-fetch/polyfill` to fix a bug that caused
  network requests to fail in node environments

## [18.0.0]

### Added

- Support for `verify` and `sign` keywords in `getFile` and `putFile`
  respectively. This enables support for ECDSA signatures on SHA256
  hashes in the storage operations, and works for encrypted and
  unencrypted files, in addition to multi-player reads (for
  unencrypted files).
- New `TransactionSigner` interface to allow for different signing agents
  in the `transactions` functions (e.g., makePreorder).
- `putFile` can now optionally take the public key for which you want
  to encrypt the file. Thanks to @bodymindarts for this!
- `handlePendingSignIn` now accepts `transitKey` as an optional 3rd parameter.
  This enables support for more complex sign in flows.

### Changed
- The gaia hub connection functions now use a JWT for authentication,
  the "v1" gaia authentication token. This is *not* a backwards
  compatible change-- an app using this version of `blockstack.js`
  will refuse to downgrade to the old protocol version unless the old
  gaia authentication provides a very specific challenge text matching
  the normal gaia hub challenge text.
- `encryptContent` now takes a public key instead of a private key to
  encrypt content for other users.
- The validateProofs() method now handles errors in proof-checking
  more seamlessly, properly catching failed promises. Previous error
  cases which resulted in uncaught exception warnings and null
  responses should now behave correctly.
- `handlePendingSignIn` now takes a second parameter which is the
   signed authentication response token. Thanks to @muneebm for this!
- Fixed an issue in `ecPairToHexString` that may result in generation of
  an incorrectly hex string encoding of the private key.
- Proofs now support subdomains.
- Updated a number of dependencies to fix know vulnerablities.
- Switched from isomorphic-fetch to the better maintained cross-fetch
  which will improve functionality of the library in node environments.


## [17.2.0]

### Added

- `encryptContent` and `decryptContent` methods for encrypting strings
  and buffers with specific keys, or by default, the
  appPrivateKey. Thanks to @nikkolasg and @nivas8292 for PRs on this
  work.
- Functions in `transactions` to support namespace creation
  (`NAMESPACE_PREORDER`, `NAMESPACE_REVEAL`, `NAMESPACE_IMPORT`,
  `ANNOUNCE`, and `NAMESPACE_READY`). Thanks @jcnelson.
- Support for `NAME_REVOKE` transactions. Thanks @jcnelson.
- `transactions.AmountType` Flow union type that captures both the
  type of JSON response from the stable `/v1/prices/*` RESTful
  endpoints on Blockstack Core, as well as the upcoming `/v2/prices/*`
  endpoints.
- Support for setting `blockstack.js` logLevels via
  `config.logLevel`. Supports strings: `['debug', 'info', 'warn',
  'error', 'none']` and defaults to `debug`. If you do not want
  `blockstack.js` to print anything to `console.log`, use
  `'none'`. Thanks @hstove.

### Changed

- Modified the transaction builders in `transactions.js` to accept a
  new flow type `transactions.AmountType` for the price of a name or
  namespace.  This makes them forwards-compatible with the next stable
  release of Blockstack Core.
- Added inline documentation on the wire formats of all transactions.

### Fixed

- Update to proof URLs for instagram proofs. Thanks @cponeill.
- Fixes to several safety checks. Thanks @jcnelson.
- Fixed error handling in proof validation -- several errors which
  would cause uncaught promise rejections now are handled correctly.
- Improved error handling in authentication -- if a user tries to sign
  in with an application is a different browser context, rather than
  experiencing a 'Key must be less than curve order' error, the
  authentication fails.
