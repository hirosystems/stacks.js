# blockstack.js [![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack.js/master.svg)](https://circleci.com/gh/blockstack/blockstack.js/tree/master) [![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

Note: If you're looking for the Blockstack CLI repo it was merged with [Blockstack Core](https://github.com/blockstack/blockstack-core).

* [Installation](#installation)
* [About](#about)
* [Auth](#auth)
* [Profiles](#profiles)
* [Testing](#testing)

## Installation

```
$ npm install blockstack
```

## About

Blockstack JS is a library for profiles/identity and authentication.

The authentication portion of this library can be used to:

1. create an authentication request
1. create an authentication response

The profiles/identity portion of this library can be used to:

1. transform a JSON profile into cryptographically-signed signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

*Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var").*

## Auth

[![Documentation](/docs-button.png)](/src/auth)

## Profiles

[![Documentation](/docs-button.png)](/src/profiles)

## Testing

```
$ npm run test
```

### Testing in a browser

*This test will only work with your browser's Cross-Origin Restrictions disabled.*

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.