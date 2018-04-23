# Changelog
All notable changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `network.BlockstackNetwork.getDefaultBurnAddress()` method to get the default burn address
  regardless of whether or not the code runs in regtest or mainnet.
- `network.BlockstackNetwork.getNamespacePrice()` method to get the price of a namespace.
- `network.BlockstackNetwork.getNamespaceInfo()` method to query the on-chain
  information for a namespace.
- `safety.isNamespaceValid()` method to check that a namespace ID is
  well-formed.
- `safety.isNamespaceAvailable()` method to check if a namespace is available
  for registration.
- `safety.revealedNamespace()` method to check if a particular address is the
  namespace's revealer.
- `safety.namespaceIsReady()` method to check whether or not a namespace has
  been launched.
- `safety.namespaceIsRevealed()` method to check whether or not a namespace has
  been revealed but not yet launched.
- `transactions.BlockstackNamespace()` class to help construct and serialize the
  `OP_RETURN` payload of a `NAMESPACE_REVEAL` transaction
- `transactions.makeRevoke()` method to create a `NAME_REVOKE` transaction.
- `transactions.makeNamespacePreorder()` method to create a `NAMESPACE_PREORDER`
  transaction.
- `transactions.makeNamespaceReveal()` method to create a `NAMESPACE_REVEAL`
  transaction.
- `transactions.makeNamespaceReady()` method to create a `NAMESPACE_READY`
  transaction.
- `transactions.makeNameImport()` method to create a `NAME_IMPORT` transaction.
- `transactions.makeAnnounce()` method to create an `ANNOUNCE` transaction.
- `transactions.estimateRevoke()` method to estimate the cost of a `NAME_REVOKE`
  transaction.
- `transactions.estimateNamespacePreorder()` method to estimate the cost of a
  `NAMESPACE_PREORDER` transaction.
- `transactions.estimateNamespaceReveal()` method to estimate the cost of a
  `NAMESPACE_REVEAL` transaction.
- `transactions.estimateNamespaceReady()` method to estimate the cost of a
  `NAMESPACE_READY` transaction.
- `transactions.estimateNameImport()` method to estimate the cost of a
  `NAME_IMPORT` transaction.
- `transactions.estimateAnnounce()` method to estimate the cost of an `ANNOUNCE`
  transaction.
- `transactions.AmountType` Flow union type that captures both the type of JSON
  response from the stable `/v1/prices/*` RESTful endpoints on Blockstack Core,
as well as the upcoming `/v2/prices/*` endpoints.

### Changed

- Modified the transaction builders in `transactions.js` to accept
  `transactions.AmountType` for the price of a name or namespace.  This makes
them forwards-compatible with the next stable release of Blockstack Core.
- Added inline documentation on the wire formats of all transactions.
