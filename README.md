# stacks.js [![Test Action](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml/badge.svg?branch=master)](https://github.com/hirosystems/stacks.js/actions/workflows/tests.yml?query=branch%3Amaster)

This repo is home to the stacks.js libraries which provide everything you need to work with the [Stacks blockchain](https://www.stacks.co/what-is-stacks).

- [`@stacks/auth`](https://github.com/hirosystems/stacks.js/tree/master/packages/auth) Construct and decode authentication requests for Stacks apps.
- [`@stacks/storage`](https://github.com/hirosystems/stacks.js/tree/master/packages/storage) Store and fetch files with Gaia, the decentralized storage system.
- [`@stacks/transactions`](https://github.com/hirosystems/stacks.js/tree/master/packages/transactions) Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain.
- [`@stacks/cli`](https://github.com/hirosystems/stacks.js/tree/master/packages/cli) Command line interface to interact with auth, storage and Stacks transactions.
- [`@stacks/stacking`](https://github.com/hirosystems/stacks.js/tree/master/packages/stacking) Library for PoX stacking.
- [`@stacks/keychain`](https://github.com/hirosystems/stacks.js/tree/master/packages/keychain) Create and manage keys/wallets for the Stacks blockchain.
- [`@stacks/network`](https://github.com/hirosystems/stacks.js/tree/master/packages/network) Network and API library for working with Stacks blockchain nodes.
- [`@stacks/encryption`](https://github.com/hirosystems/stacks.js/tree/master/packages/encryption) Encryption functions used by stacks.js packages.
- [`@stacks/profile`](https://github.com/hirosystems/stacks.js/tree/master/packages/profile) Functions for manipulating user profiles.
- [`@stacks/common`](https://github.com/hirosystems/stacks.js/tree/master/packages/common) Common utilities used by stacks.js packages.
- [`@stacks/bns`](https://github.com/hirosystems/stacks.js/tree/master/packages/bns) Library for interacting with the BNS contract.
- [`@stacks/wallet-sdk`](https://github.com/hirosystems/stacks.js/tree/master/packages/wallet-sdk) Library for building wallets for the Stacks blockchain.

See `README` in each package directory for installation instructions and usage.

## Importing & Polyfills

Most of the stacks.js packages are released in multiple different forms.
These typically include:

- `commonjs` under `/dist`
- `esm` under `/dist/esm`
- `umd` (with all dependencies bundled and polyfilled for the browser) under `/dist/umd`

- an additional `esm` bundle (with external dependecies bundled and polyfilled for the browser) under `/dist/polyfill`

Build systems try to be smart and auto-detect the correct type.
But you can specify which type to import as follows:

```js
import { generateSecretKey } from '@stacks/wallet-sdk'; // auto-detect
import { generateSecretKey } from '@stacks/wallet-sdk/dist/polyfill'; // esm bundle
const walletSdk = require('@stacks/wallet-sdk'); // auto-detect
const walletSdk = require('@stacks/wallet-sdk/dist/umd'); // umd bundle
// ...
```

The following package types have been observed to work well out-of-the-box with common frameworks.

| Framework | Import Type      |
| --------- | ---------------- |
| React     | `/dist/umd`      |
| Next.js   | _auto-detect_    |
| Vue       | `/dist/umd`      |
| Svelte    | `/dist/polyfill` |

For production builds it is recommended to configure the respective build system to optimize further.
For more fine-grained control, import using `esm` and configure your build system to polyfill any necessary dependencies.
You could also `alias` the packages to their `/dist/<TYPE>` alternative.
E.g., if you are already polyfilling in webpack, add a `resolve.alias` section [like this](https://github.com/janniks/stacks-wallet-web/blob/fea34ecfa667518ea9eecdf3b8161aa8e3fad1e3/webpack/webpack.config.base.js#L72-L82).

We are currently working to get rid of many dependencies to remove the need for complex configuration.
For now, if you are seeing problems, try the `/dist/umd` import.
Otherwise, [open a new issue](https://github.com/hirosystems/stacks.js/issues/new/choose) with details on your build setup.

> We're currently seeing some problems with the `/dist/polyfill` of the `@stacks/encryption` package — use the `/dist/umd` imports here instead.

## Migrating from blockstack.js

To migrate your app from blockstack.js to stacks.js follow the steps in the [migration guide](https://github.com/hirosystems/stacks.js/tree/master/.github/MIGRATION_GUIDE.md).

## Development: environment setup

To setup the development environment for this repository, follow these steps:

> **Prerequisites**:
> - Node v16.x.x is recommended (Node v17 may run into [issues](https://github.com/hirosystems/stacks.js/issues/1176) that can be [worked around](https://github.com/webpack/webpack/issues/14532#issuecomment-947012063))

1. Clone this package.
2. Run `npm install` to install dependencies
3. Run `npm run bootstrap` to [bootstrap](https://github.com/lerna/lerna/tree/main/commands/bootstrap) project
4. Run `npm run build` to build packages
5. Run `npm run test` to run tests
6. 🚀

> Some tests may contain logging of errors and warnings.
> This should not be confused with failing tests.
> Make sure the last lines of `npm run test` show `lerna success - @stacks/...` for every package.

## Development: adding dependencies

This repo uses Lerna [hoisting](https://github.com/lerna/lerna/blob/main/doc/hoist.md) for package dependencies.

In order to install a new dependency to a package, the [`lerna add`](https://github.com/lerna/lerna/tree/main/commands/add) command must be used, rather than `npm install <package>`.

For example, the following command installs `lodash` as a dependency to the `@stacks/storage` package:

```shell
# Run within the root directory
npx lerna add lodash --scope @stacks/storage
```

Add `--dev` to install as a development dependency:

```shell
npx lerna add lodash --scope @stacks/storage --dev
```

## Documentation

Documentation for the stacks.js packages is located at [stacks.js.org](https://stacks.js.org/).

## Contributing

Github issues marked [help-wanted](https://github.com/hirosystems/stacks.js/labels/help-wanted)
are great places to start. Please ask in a github issue or discord before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!
