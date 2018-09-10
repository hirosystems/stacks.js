import * as blockstack from './index'

if (typeof Duktape !== 'undefined') {
  // we're running in a Duktape environment
  global.blockstack = blockstack
}
