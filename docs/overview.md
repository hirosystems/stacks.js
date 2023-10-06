---
sidebar_label: Overview
---

# Stacks.js Overview

<div className="gap-3 flex flex-wrap mb-6">
  <a
    className="inline-block bg-neutral-200 hover:bg-neutral-100 rounded-md text-sm text-neutral-700 px-2 py-1 hover:text-neutral-700 hover:no-underline transition-colors"
    href="https://stacks.js.org"
  >
    Stacks.js Reference <span className="i-radix-icons-link-2 align-text-bottom text-lg"></span>
  </a>
  <a
    className="inline-block bg-neutral-200 hover:bg-neutral-100 rounded-md text-sm text-neutral-700 px-2 py-1 hover:text-neutral-700 hover:no-underline transition-colors"
    href="https://connect.stacks.js.org"
  >
    Stacks Connect Reference <span className="i-radix-icons-link-2 align-text-bottom text-lg"></span>
  </a>
  <a
    className="inline-block bg-violet-300 hover:bg-violet-200 rounded-md text-sm text-violet-800 px-2 py-1 hover:text-violet-800 hover:no-underline transition-colors"
    href="https://discord.com/channels/621759717756370964/1022879438515486791"
  >
    Discord Support <span className="i-bi-discord align-text-bottom text-lg"></span>
  </a>
  <a
    className="inline-block bg-cyan-300 hover:bg-cyan-200 rounded-md text-sm text-cyan-800 px-2 py-1 hover:text-cyan-800 hover:no-underline transition-colors"
    href="https://www.hiro.so/search?query=Stacks.js"
  >
    Blogposts <span className="i-radix-icons-file-text align-text-bottom text-lg"></span>
  </a>
  <a
    className="inline-block bg-blue-300 hover:bg-blue-200 rounded-md text-sm text-blue-800 px-2 py-1 hover:text-blue-800 hover:no-underline transition-colors"
    href="https://www.youtube.com/watch?v=SGrbeoCSHs0"
  >
    Videos <span className="i-bi-person-video align-text-bottom text-lg"></span>
  </a>
</div>

Stacks.js is an SDK for building on the Stacks blockchain.
It's a collection of various JavaScript libraries allowing developers to interact with the Stacks blockchain or allow their users to.

<!-- todo: add color -->

<div class="subSections my-8">
  <a href="/stacks.js/connect">
    <div class="subSectionTitle"><h3>Stacks Connect 🌐</h3><span>→</span></div>
    <p>Build Stacks-ready web applications</p>
  </a>
  <a href="/stacks.js/getting-started">
    <div class="subSectionTitle"><h3>Getting Started</h3><span>→</span></div>
    <p>Explore all that Stacks.js has to offer</p>
  </a>
</div>

There are two main ways developers build applications on the Stacks blockchain:

### 🔒 Without Direct Private Key Access

For example, a web app that allows users to interact with the Stacks blockchain using their Stacks wallet (browser extension or mobile).

Most users interact via their favorite Stacks wallet.
Developers can build web apps, which prompt the user for an action (e.g. sign a transaction), and then the wallet will handle the rest.
The wallet will act in the security, and best interest of the user, and the user will be able to review the transaction before signing.
[Read more](./connect.md)

### 🔑 With Private Key Access

For example, managing funds with the Stacks.js CLI, building a backend (which can sign transactions directly).

Nevertheless, direct private key access is needed for some use cases.
Developers can build simple scripts and tools intended for "offline" use.
Users may use the Stacks.js CLI directly to send a transaction.
Backends may need to automate signing without direct user interaction.
In these cases, developers can use the same libraries used by Stacks wallets for account handling and transaction signing.
[Read more](./installing.md)
