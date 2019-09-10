# blockstack.js [![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack.js/master.svg)](https://circleci.com/gh/blockstack/blockstack.js/tree/master) [![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![Slack](https://img.shields.io/badge/join-slack-e32072.svg?style=flat)](http://slack.blockstack.org/)

Note: If you're looking for the Blockstack CLI repo it was merged with [Blockstack Core](https://github.com/blockstack/blockstack-core).

  - [Installation](#installation)
  - [About](#about)
  - [Documentation](#documentation)
  - [Compatibility](#compatibility)
  - [Contributing](#contributing)
  - [Maintainer](#maintainer)
  - [Testing](#testing)
    - [Testing in a browser](#testing-in-a-browser)
  - [Releasing](#releasing)

## Installation

```
$ npm install blockstack
```

You can import `blockstack.js` as a script without using a package manager. To securely use the latest distribution of blockstack.js from a CDN, add [the mdincludes/script-dist-file.md](mdincludes/script-dist-file.md) script in your application. 


## About

Blockstack JS is a library for profiles/identity, authentication, and storage.

The authentication portion of this library can be used to:

1.  create an authentication request
2.  create an authentication response

The profiles/identity portion of this library can be used to:

1.  transform a JSON profile into cryptographically-signed tokens
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
[flow static type annotations](https://flow.org) and be lint free. Open your pull request using the template in  `PULL_REQUEST_TEMPLATE.md`

Github issues marked [help-wanted](https://github.com/blockstack/blockstack.js/labels/help-wanted)
are great places to start. Please ask in a github issue or slack before embarking
on larger issues that aren't labeled as help wanted or adding additional
functionality so that we can make sure your contribution can be included!

## Maintainer

This repository is maintained by [yukan.id](https://explorer.blockstack.org/name/yukan.id).

## Testing

    $ npm run test

    We test on the "Active LTS" version of Node.

### Testing in a browser

_This test will only work with your browser's Cross-Origin Restrictions disabled._

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.

## Releasing
See `release-checklist.md`
