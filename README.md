# Stacks.js Monorepo [![CircleCI](https://img.shields.io/circleci/project/blockstack/stacks.js/master.svg)](https://circleci.com/gh/blockstack/stacks.js/tree/master)

This repo is home to the Stacks.js libraries which provide everything you need to work with the Stacks blockchain.

- [`@stacks/auth`](https://github.com/blockstack/stacks.js/tree/master/packages/auth) Construct and decode authentication requests for Stacks apps.
- [`@stacks/storage`](https://github.com/blockstack/stacks.js/tree/master/packages/storage) Store and fetch files with Gaia, the decentralized storage system.
- [`@stacks/transactions`](https://github.com/blockstack/stacks.js/tree/master/packages/transactions) Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain.
- [`@stacks/cli`](https://github.com/blockstack/stacks.js/tree/master/packages/cli) Command line interface to interact with auth, storage and Stacks transactions.
- [`@stacks/stacking`](https://github.com/blockstack/stacks.js/tree/master/packages/stacking) Library for PoX stacking.
- [`@stacks/keychain`](https://github.com/blockstack/stacks.js/tree/master/packages/keychain) Create and manage keys/wallets for the Stacks blockchain.
- [`@stacks/network`](https://github.com/blockstack/stacks.js/tree/master/packages/network) Network and API library for working with Stacks blockchain nodes.
- [`@stacks/encryption`](https://github.com/blockstack/stacks.js/tree/master/packages/encryption) Encryption functions used by Stacks.js packages.
- [`@stacks/profile`](https://github.com/blockstack/stacks.js/tree/master/packages/profile) Functions for manipulating user profiles.
- [`@stacks/common`](https://github.com/blockstack/stacks.js/tree/master/packages/common) Common utilities used by Stacks.js packages.

See `README` in each package directory for installation instructions and usage.

## Migrating from blockstack.js

To migrate your app from blockstack.js to stacks.js follow the steps in the [migration guide](https://github.com/blockstack/stacks.js/tree/master/migration-guide.md).

## Development environment setup

To setup the development environment for this repository, follow these steps:

1. Clone this package.
2. Run `lerna bootstrap` to install dependencies
3. Run `lerna run build` to build packages
4. Run `lerna run test` to run tests

## Documentation

[![Documentation](/docs-button.png)](https://docs.blockstack.org/)

## Contributing

Github issues marked [help-wanted](https://github.com/blockstack/stacks.js/labels/help-wanted)
are great places to start. Please ask in a github issue or discord before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!
