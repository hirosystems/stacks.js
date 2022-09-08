# Stacks.js [![Test Action Badge](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml/badge.svg)](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml) [![Monorepo Version Label](https://img.shields.io/github/lerna-json/v/hirosystems/stacks.js?label=monorepo)](https://github.com/hirosystems/stacks.js/tree/master/packages)

This repo is home to most of the stacks.js libraries, which provide everything you need to work with the [Stacks blockchain](https://www.stacks.co/what-is-stacks) from JavaScript/TypeScript.

#### Connecting Wallets

- [`@stacks/connect`](https://github.com/hirosystems/connect) Connect web application to Stacks wallet browser extensions _(separate repo)_.

#### Stacks Primitives

- [`@stacks/transactions`](https://github.com/hirosystems/stacks.js/tree/master/packages/transactions) Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain.
- [`@stacks/wallet-sdk`](https://github.com/hirosystems/stacks.js/tree/master/packages/wallet-sdk) Library for building wallets, managing accounts, and handling keys for the Stacks blockchain.
- [`@stacks/storage`](https://github.com/hirosystems/stacks.js/tree/master/packages/storage) Store and fetch files with Gaia, the decentralized storage system.
- [`@stacks/encryption`](https://github.com/hirosystems/stacks.js/tree/master/packages/encryption) Encryption functions used by stacks.js packages.
- [`@stacks/auth`](https://github.com/hirosystems/stacks.js/tree/master/packages/auth) Construct and decode authentication requests for Stacks apps.
- [`@stacks/profile`](https://github.com/hirosystems/stacks.js/tree/master/packages/profile) Functions for manipulating user profiles.
- [`@stacks/network`](https://github.com/hirosystems/stacks.js/tree/master/packages/network) Network and API library for working with Stacks blockchain nodes.
- [`@stacks/common`](https://github.com/hirosystems/stacks.js/tree/master/packages/common) Common utilities used by stacks.js packages.

#### Native Smart Contract Interaction

- [`@stacks/bns`](https://github.com/hirosystems/stacks.js/tree/master/packages/bns) Library for interacting with the BNS contract.
- [`@stacks/stacking`](https://github.com/hirosystems/stacks.js/tree/master/packages/stacking) Library for PoX stacking.

#### Others

- [`@stacks/cli`](https://github.com/hirosystems/stacks.js/tree/master/packages/cli) Command line interface to interact with auth, storage and Stacks transactions.
- [`@stacks/keychain`](https://github.com/hirosystems/stacks.js/tree/master/packages/keychain) _**DEPRECATED:** replaced by `@stacks/wallet-sdk`_

See the respective `README` in each package directory for installation instructions and usage.

---

## Documentation

Documentation and library references for the stacks.js packages are located at [stacks.js.org](https://stacks.js.org/).

### Migrating from previous versions

To migrate your app from blockstack.js to Stacks.js follow the steps in the respective [migration guide](./.github/MIGRATION.md).

## Contributing & Development

Github issues marked [help-wanted](https://github.com/hirosystems/stacks.js/labels/help-wanted)
are great places to start. Please ask in a github issue or discord before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!

### Environment setup

To setup the development environment for this repository, follow these steps:

> **Prerequisites**:
>
> - Node v16.x.x is recommended (Node v17 may run into [issues](https://github.com/hirosystems/stacks.js/issues/1176) that can be [worked around](https://github.com/webpack/webpack/issues/14532#issuecomment-947012063))

1. Clone this package.
2. Run `npm install` to install dependencies
3. Run `npm run bootstrap` to [bootstrap](https://github.com/lerna/lerna/tree/main/commands/bootstrap) project
4. Run `npm run build` to build packages
5. Run `npm run test` to run tests

> Some tests may contain logging of errors and warnings.
> This should not be confused with failing tests.
> Make sure the last lines of `npm run test` show `lerna success - @stacks/...` for every package.
