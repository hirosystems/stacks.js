---
title: Overview
---

# Stacks.js Overview

Stacks.js is an SDK for building on the Stacks blockchain.
It's a collection of various JavaScript libraries allowing developers to interact with the Stacks blockchain or allow their users to.

<!-- todo: add better UI, e.g. grid of cards -->

There are two main ways developers build applications on the Stacks blockchain:

- 🔒 **Without Direct Private Key Access**: For example, a web app that allows users to interact with the Stacks blockchain using their Stacks wallet (browser extension or mobile). Read More in the Connect Guide
- 🔑 **With Private Key Access**: For example, managing funds with the Stacks.js CLI, building a backend (which can sign transactions directly).

Most users interact via their favorite Stacks wallet.
Developers can build web apps, which prompt the user for an action (e.g. sign a transaction), and then the wallet will handle the rest.
The wallet will act in the security, and best interest of the user, and the user will be able to review the transaction before signing.

Nevertheless, direct private key access is needed for some use cases.
Developers can build simple scripts and tools intended for "offline" use.
Users may use the Stacks.js CLI directly to send a transaction.
Backends may need to automate signing without direct user interaction.
In these cases, developers can use the same libraries used by Stacks wallets for account handling and transaction signing.

---

There are three main integrations used by Stacks enabled applications:

<!-- todo: add a card and better how-to-guide for each, (eg add message signing backend checking) -->

- **Authentication**: Register and sign users in with identities on the Stacks blockchain
- **Transaction signing**: Prompt users to sign and broadcast transactions to the Stacks blockchain
- **Data storage**: Save and retrieve data for users with [Gaia](https://docs.stacks.co/build-apps/references/gaia)

All three of these integrations can be used together to create powerful new user experiences that rival or exceed those of traditional apps while protecting your users' digital rights.

import StacksjsStartersNote from './includes/\_stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

## References

<!-- todo: add github icon component -->

Below is a list of all Stacks.js libraries and a few JS libraries and helpers maintained by Hiro:

### Connecting Wallets

- [`@stacks/connect`](https://connect.stacks.js.org/) Connect web application to Stacks wallet browser extensions. [Github](https://github.com/hirosystems/connect)

### Stacks Primitives

- [`@stacks/transactions`](https://stacks.js.org/modules/_stacks_transactions) Construct, decode transactions and work with Clarity smart contracts on the Stacks blockchain. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/transactions)
- [`@stacks/wallet-sdk`](https://stacks.js.org/modules/_stacks_wallet_sdk) Library for building wallets, managing accounts, and handling keys for the Stacks blockchain. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/wallet-sdk)
- [`@stacks/storage`](https://stacks.js.org/modules/_stacks_storage) Store and fetch files with Gaia, the decentralized storage system. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/storage)
- [`@stacks/encryption`](https://stacks.js.org/modules/_stacks_encryption) Encryption functions used by stacks.js packages. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/encryption)
- [`@stacks/auth`](https://stacks.js.org/modules/_stacks_auth) Construct and decode authentication requests for Stacks apps. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/auth)
- [`@stacks/profile`](https://stacks.js.org/modules/_stacks_profile) Functions for manipulating user profiles. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/profile)
- [`@stacks/network`](https://stacks.js.org/modules/_stacks_network) Network and API library for working with Stacks blockchain nodes. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/network)
- [`@stacks/common`](https://stacks.js.org/modules/_stacks_common) Common utilities used by stacks.js packages. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/common)

### Native Smart Contract Interaction

- [`@stacks/bns`](https://stacks.js.org/modules/_stacks_bns) Library for interacting with the BNS contract. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/bns)
- [`@stacks/stacking`](https://stacks.js.org/modules/_stacks_stacking) Library for PoX stacking. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/stacking)

### Others

- [`@stacks/cli`](/references/stacks-cli) Command line interface to interact with auth, storage, and Stacks transactions. [Github](https://github.com/hirosystems/stacks.js/tree/master/packages/cli)
- [`@stacks/blockchain-api-client`](https://hirosystems.github.io/stacks-blockchain-api/client/) Auto-generated REST and websocket API for all endpoints provided by the Stacks Blockchain API. [Github](https://github.com/hirosystems/stacks-blockchain-api/tree/master/client)
- `@stacks/keychain` _DEPRECATED: replaced by `@stacks/wallet-sdk`._

## Development

There is a main [Stacks.js monorepo](https://github.com/hirosystems/stacks.js) containing most of the packages, but a few others often also considered as a part of "Stacks.js".

Are we missing anything?
Feel free to open issues in the Github repositories.
