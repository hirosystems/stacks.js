# Blockstack Proofs

[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

### Contents

* [Installation](#installation)
* [Importing](#importing)
* [Proofs](#proof)

A library for verifying blockstack profile proofs.

*Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var").*

### Installation

```
$ npm install blockstack-proofs
```

### Importing

#### ES6

```es6
import {
  profileToProofs
} from 'blockstack-proofs'
```

#### Node

```es6
var blockstackProofs = require('blockstack-proofs')
```

### Usage

```es6
let username = "naval"
let proofs = profileToProofs(profile, username)
console.log(proofs)

[
  { "identifier": "naval",
    "proof_url": "https://twitter.com/naval/status/486609266212499456",
    "service": "twitter",
    "valid": true
  },
  {
      "identifier": "navalr",
      "proof_url": "https://facebook.com/navalr/posts/10152190734077261",
      "service": "facebook",
      "valid": true
  },
  {
    "identifier": "navalr",
    "proof_url": "https://gist.github.com/navalr/f31a74054f859ec0ac6a",
    "service": "github",
    "valid": true
  }
]

```
