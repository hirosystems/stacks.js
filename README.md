# blockstack.js [![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack.js/master.svg)](https://circleci.com/gh/blockstack/blockstack.js/tree/master) [![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![Slack](https://img.shields.io/badge/join-slack-e32072.svg?style=flat)](http://slack.blockstack.org/)

Note: If you're looking for the Blockstack CLI repo it was merged with [Blockstack Core](https://github.com/blockstack/blockstack-core).

-   [Installation](#installation)
-   [About](#about)
-   [Auth](https://blockstack.github.io/blockstack.js/index.html#authentication)
-   [Profiles](https://blockstack.github.io/blockstack.js/index.html#profiles)
-   [Storage](https://blockstack.github.io/blockstack.js/index.html#storage)
-   [Documentation](#documentation)
-   [Compatibility](#compatibility)
-   [Contributing](#contributing)
-   [Maintainer](#maintainer)
-   [Testing](#testing)
-   [Releasing](#releasing)

## Installation

    $ npm install blockstack

### Production usage

**NOTE**: If you uglify your the JavaScript, you'll need to exclude the following variable names from being mangled: `BigInteger`, `ECPair`, `Point`.

This is because of the function-name-duck-typing used in [typeforce](https://github.com/dcousens/typeforce) which is used by the dependency [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib).

Example:
``` bash
uglifyjs ... --mangle reserved=['BigInteger','ECPair','Point']
```

## About

Blockstack JS is a library for profiles/identity, authentication, and storage.

The authentication portion of this library can be used to:

1.  create an authentication request
2.  create an authentication response

The profiles/identity portion of this library can be used to:

1.  transform a JSON profile into cryptographically-signed signed tokens
2.  recover a JSON profile from signed tokens
3.  validate signed profile tokens

The storage portion of this library can be used to:

1. store and retrieve your app's data in storage that is controlled by the user

_Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var")._

## Documentation

[![Documentation](/docs-button.png)](http://blockstack.github.io/blockstack.js/index.html)

## Compatibility

_Note:_ blockstack.js 0.14.0 and newer versions use a new on-disk format that is not backward compatible with prior versions.

## Contributing

This repository uses the [git flow branching mode](http://nvie.com/posts/a-successful-git-branching-model/).

The latest released code as deployed to npm is in `master` and the latest delivered development
changes for the next release are in `develop`.

We use the [git-flow-avh](https://github.com/petervanderdoes/gitflow-avh) plugin.

Please send pull requests against `develop`. Pull requests should include tests,
[flow static type annotations](https://flow.org) and be lint free.

Github issues marked [help-wanted](https://github.com/blockstack/blockstack.js/labels/help-wanted)
are great places to start. Please ask in a github issue or slack before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!

## Maintainer

This repository is maintained by @larrysalibra.

## Testing

    $ npm run test

### Testing in a browser

_This test will only work with your browser's Cross-Origin Restrictions disabled._

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.

## Releasing

- `git flow release start <version>`
- Increment version in `package.json` and commit
- `npm publish`
- Commit built documentation and distribution
- `git flow release finish`
