'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ellipticKeychain = require('elliptic-keychain');

var _bitcoinjsLib = require('bitcoinjs-lib');

var _jwtJs = require('jwt-js');

var _ellipticCurve = require('elliptic-curve');

function signProfileTokens(profileComponents, privateKeychain) {
  var signingAlgorithm = arguments.length <= 2 || arguments[2] === undefined ? 'ES256K' : arguments[2];

  if (!privateKeychain instanceof _ellipticKeychain.PrivateKeychain) {
    throw new Error('Invalid private keychain');
  }

  var ellipticCurve = undefined;
  if (signingAlgorithm === 'ES256K') {
    ellipticCurve = _ellipticCurve.secp256k1;
  } else {
    throw new Error('Signing algorithm not supported');
  }

  var tokenRecords = [],
      parentPublicKey = privateKeychain.publicKeychain().publicKey('hex');

  profileComponents.map(function (data) {
    var derivationEntropy = _bitcoinjsLib.crypto.sha256(Buffer.concat([privateKeychain.privateKey(), new Buffer(JSON.stringify(data))]));

    var privateChildKeychain = privateKeychain.child(derivationEntropy),
        privateKey = privateChildKeychain.privateKey('hex'),
        publicKey = privateChildKeychain.publicKeychain().publicKey('hex');

    var payload = {
      claim: data,
      subject: publicKey,
      issuedAt: new Date(),
      expiresAt: new Date().setYear(new Date().getFullYear() + 1)
    };

    var tokenSigner = new _jwtJs.TokenSigner(signingAlgorithm, privateKey),
        token = tokenSigner.sign(payload);

    var tokenRecord = {
      token: token,
      data: (0, _jwtJs.decodeToken)(token),
      publicKey: publicKey,
      parentPublicKey: parentPublicKey,
      derivationEntropy: derivationEntropy.toString('hex'),
      encrypted: false
    };

    tokenRecords.push(tokenRecord);
  });

  return tokenRecords;
}

function validateTokenRecord(tokenRecord, publicKeychain) {
  if (!publicKeychain) {
    throw new Error('A public keychain is required');
  }

  var token = tokenRecord.token,
      decodedToken = (0, _jwtJs.decodeToken)(token);

  var tokenVerifier = new _jwtJs.TokenVerifier(decodedToken.header.alg, tokenRecord.publicKey);
  if (!tokenVerifier) {
    throw new Error('Invalid token verifier');
  }

  var tokenVerified = tokenVerifier.verify(token);
  if (!tokenVerified) {
    throw new Error('Token verification failed');
  }

  var childKeychain = publicKeychain.child(new Buffer(tokenRecord.derivationEntropy, 'hex'));
  if (childKeychain.publicKey('hex') !== tokenRecord.publicKey) {
    throw new Error('Child public key is not a valid child of the parent public key');
  }

  return;
}

function getProfileFromTokens(tokenRecords, publicKeychain) {
  var profile = {};

  tokenRecords.map(function (tokenRecord) {
    var token = tokenRecord.token,
        decodedToken = (0, _jwtJs.decodeToken)(token);

    validateTokenRecord(tokenRecord, publicKeychain);

    profile = Object.assign({}, profile, decodedToken.payload.claim);
  });

  return profile;
}

exports.default = {
  signProfileTokens: signProfileTokens,
  getProfileFromTokens: getProfileFromTokens,
  validateTokenRecord: validateTokenRecord
};