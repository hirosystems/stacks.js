'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Person = function Person(profile, context) {
  _classCallCheck(this, Person);

  if (!context) {
    context = 'http://schema.org/';
  }
  if (!profile) {
    profile = {};
  }
  this.profile = Object.assign({}, {
    '@context': context,
    '@type': 'CreativeWork'
  }, profile);
};

exports.default = Person;