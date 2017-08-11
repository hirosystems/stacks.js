# blockstack.js [![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack.js/master.svg)](https://circleci.com/gh/blockstack/blockstack.js/tree/master) [![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

Note: If you're looking for the Blockstack CLI repo it was merged with [Blockstack Core](https://github.com/blockstack/blockstack-core).

-   [Installation](#installation)
-   [About](#about)
-   [Auth](https://blockstack.github.io/blockstack.js/index.html#authentication)
-   [Profiles](https://blockstack.github.io/blockstack.js/index.html#profiles)
-   [Storage](https://blockstack.github.io/blockstack.js/index.html#storage)
-   [Testing](#testing)
-   [Documentation](#documentation)

## Installation

    $ npm install blockstack

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

## Testing

    $ npm run test

### Testing in a browser

_This test will only work with your browser's Cross-Origin Restrictions disabled._

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.
