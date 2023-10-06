---
sidebar_label: Installing
---

import GithubLink from '../../src/components/GithubLink.tsx';

# Installing Stacks.js Packages

Stacks.js is separated into many smaller packages, which can be installed individually.
Most packages are published to npm under the `@stacks` scope.

Let's install the `@stacks/network` package:

```sh
npm install @stacks/network
```

## Packages

<details>
  <summary>Full list of available packages</summary>

### Connecting Wallets

- [`@stacks/connect`](https://stacks.js.org/modules/_stacks_connect) <GithubLink href="https://github.com/hirosystems/connect/tree/main/packages/connect" title=""/> Connect web application to Stacks wallet browser extensions.

### Stacks Primitives

- [`@stacks/transactions`](https://stacks.js.org/modules/_stacks_transactions) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/transactions" title=""/> Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain.
- [`@stacks/wallet-sdk`](https://stacks.js.org/modules/_stacks_wallet_sdk) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/wallet-sdk" title=""/> Library for building wallets, managing accounts, and handling keys for the Stacks blockchain.
- [`@stacks/storage`](https://stacks.js.org/modules/_stacks_storage) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/storage" title=""/> Store and fetch files with Gaia, the decentralized storage system.
- [`@stacks/encryption`](https://stacks.js.org/modules/_stacks_encryption) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/encryption" title=""/> Encryption functions used by stacks.js packages.
- [`@stacks/auth`](https://stacks.js.org/modules/_stacks_auth) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/auth" title=""/> Construct and decode authentication requests for Stacks apps.
- [`@stacks/profile`](https://stacks.js.org/modules/_stacks_profile) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/profile" title=""/> Functions for manipulating user profiles.
- [`@stacks/network`](https://stacks.js.org/modules/_stacks_network) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/network" title=""/> Network and API library for working with Stacks blockchain nodes.
- [`@stacks/common`](https://stacks.js.org/modules/_stacks_common) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/common" title=""/> Common utilities used by stacks.js packages.

### Native Smart Contract Interaction

- [`@stacks/bns`](https://stacks.js.org/modules/_stacks_bns) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/bns" title=""/> Library for interacting with the BNS contract.
- [`@stacks/stacking`](https://stacks.js.org/modules/_stacks_stacking) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/stacking" title=""/> Library for PoX stacking.

### Others

- [`@stacks/cli`](/references/stacks-cli) <GithubLink href="https://github.com/hirosystems/stacks.js/tree/main/packages/cli" title=""/> Command line interface to interact with auth, storage, and Stacks transactions.
- [`@stacks/blockchain-api-client`](https://hirosystems.github.io/stacks-blockchain-api/client/) <GithubLink href="https://github.com/hirosystems/stacks-blockchain-api/tree/master/client" title=""/> Auto-generated REST and websocket API for all endpoints provided by the Stacks Blockchain API.
- `@stacks/keychain` **DEPRECATED**, replaced by `@stacks/wallet-sdk`

</details>

The most commonly used packages are:

- [`@stacks/connect`](https://connect.stacks.js.org/modules/_stacks_connect) — Stacks Connect, for building Stacks-ready web applications
- [`@stacks/network`](https://stacks.js.org/modules/_stacks_network) — Network configuration (used together with other packages)
- [`@stacks/transactions`](https://stacks.js.org/modules/_stacks_transactions) — Transaction construction, serialization, Clarity helpers, and more
- [`@stacks/blockchain-api-client`](https://hirosystems.github.io/stacks-blockchain-api/client/) — Auto-generated API client (with websocket support) for all Stacks Blockchain API endpoints.

<div class="space-x-3 mb-4">
  <a class="bg-neutral-200 rounded-md text-sm text-neutral-700 px-2 py-1" href="https://stacks.js.org">Stacks.js Reference →</a>
  <a class="bg-neutral-200 rounded-md text-sm text-neutral-700 px-2 py-1" href="https://connst.stacks.js.org">Stacks Connect Reference →</a>
</div>

The source-code for most packages live in the [Stacks.js monorepo](https://https://github.com/hirosystems/stacks.js) or the [Stacks Connect monorepo](https://github.com/hirosystems/connect) on GitHub.

<!-- todo: add github icon component -->

<!-- todo: add all -->
<!-- ## References

Below is a list of all Stacks.js libraries and a few JS libraries and helpers maintained by Hiro:


## Development

There is a main [Stacks.js monorepo](https://github.com/hirosystems/stacks.js) containing most of the packages, but there are a few others often als considered as a part of "Stacks.js".

Are we missing anything?
Feel free to open issues in the Github repositories. -->
