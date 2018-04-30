# Changelog
All notable changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
