# Stacks.js [![Test Action](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml/badge.svg?branch=master)](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml?query=branch%3Amaster)

This repo is home to the Stacks.js libraries which provide everything you need to work with the [Stacks blockchain](https://www.stacks.co/what-is-stacks).

- [`@stacks/auth`](https://github.com/hirosystems/stacks.js/tree/master/packages/auth) Construct and decode authentication requests for Stacks apps.
- [`@stacks/storage`](https://github.com/hirosystems/stacks.js/tree/master/packages/storage) Store and fetch files with Gaia, the decentralized storage system.
- [`@stacks/transactions`](https://github.com/hirosystems/stacks.js/tree/master/packages/transactions) Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain.
- [`@stacks/cli`](https://github.com/hirosystems/stacks.js/tree/master/packages/cli) Command line interface to interact with auth, storage and Stacks transactions.
- [`@stacks/stacking`](https://github.com/hirosystems/stacks.js/tree/master/packages/stacking) Library for PoX stacking.
- [`@stacks/keychain`](https://github.com/hirosystems/stacks.js/tree/master/packages/keychain) Create and manage keys/wallets for the Stacks blockchain.
- [`@stacks/network`](https://github.com/hirosystems/stacks.js/tree/master/packages/network) Network and API library for working with Stacks blockchain nodes.
- [`@stacks/encryption`](https://github.com/hirosystems/stacks.js/tree/master/packages/encryption) Encryption functions used by Stacks.js packages.
- [`@stacks/profile`](https://github.com/hirosystems/stacks.js/tree/master/packages/profile) Functions for manipulating user profiles.
- [`@stacks/common`](https://github.com/hirosystems/stacks.js/tree/master/packages/common) Common utilities used by Stacks.js packages.
- [`@stacks/bns`](https://github.com/hirosystems/stacks.js/tree/master/packages/bns) Library for interacting with the BNS contract.
- [`@stacks/wallet-sdk`](https://github.com/hirosystems/stacks.js/tree/master/packages/wallet-sdk) Library for building wallets for the Stacks blockchain.

See `README` in each package directory for installation instructions and usage.

## Migrating from blockstack.js

To migrate your app from blockstack.js to stacks.js follow the steps in the [migration guide](https://github.com/hirosystems/stacks.js/tree/master/migration-guide.md).

## Development: environment setup

To setup the development environment for this repository, follow these steps:

1. Clone this package.
2. Run `npm install` to install dependencies
3. Run `npm run bootstrap` to [bootstrap](https://github.com/lerna/lerna/tree/main/commands/bootstrap) project
4. Run `npm run build` to build packages
5. Run `npm run test` to run tests

## Development: adding dependencies

This repo uses Lerna [hoisting](https://github.com/lerna/lerna/blob/main/doc/hoist.md) for package dependencies.

In order to install a new dependency to a package, the [`lerna add`](https://github.com/lerna/lerna/tree/main/commands/add) command must be used, rather than `npm install <package>`.

For example, the following command installs `lodash` as a dependency to the `@stacks/storage` package:

```shell
# Run within the root directory
npm run lerna -- add lodash --scope @stacks/storage
```

Add `--dev` to install as a development dependency:

```shell
npm run lerna -- add lodash --scope @stacks/storage --dev
```

## Documentation

Documentation for the Stacks.js packages is located [here](https://stacks-js-git-master-blockstack.vercel.app/).

## Contributing

Github issues marked [help-wanted](https://github.com/hirosystems/stacks.js/labels/help-wanted)
are great places to start. Please ask in a github issue or discord before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!
