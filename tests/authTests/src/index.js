// This test is meant to be run from the integration test framework
// see https://github.com/blockstack/blockstack-core/tree/master/integration_tests

import {
    getCoreSession,
    makeAuthRequest   
} from '../../../lib';

const assert = require('assert');
const jsontokens = require('jsontokens');

var privk_client = '8b13483d65e55eb2184ff7c9978379eff2fae7ad40da09ae4e3e5cf84b36a550';
var privk_app = '99c01d085f7914e4725ffa3160df583c37cc27e1e7fd48f2d6e17d4a9a4ba55e';
var api_pass = "blockstack_integration_test_api_password"

var auth_request = makeAuthRequest(privk_client, "https://www.foo.com", "https://www.foo.com/manifest.json", "https://www.foo.com/login", ['store_read', 'store_write', 'store_admin']);

getCoreSession("localhost", 16268, api_pass, privk_app, "judecn.id", auth_request)
.then((session) => {
   console.log("success!");
   console.log(session);

   // inspect session 
   var tok = jsontokens.decodeToken(session);
   var payload = tok.payload;

   assert(payload.app_domain == 'www.foo.com');

   assert(payload.methods[0] == 'store_read');
   assert(payload.methods[1] == 'store_write');
   assert(payload.methods[2] == 'store_admin');
   assert(payload.methods.length == 3);

   assert(payload.app_public_key == jsontokens.SECP256K1Client.derivePublicKey(privk_app));

   assert(payload.blockchain_ids[0] == 'judecn.id')
   return true;

}, (error) => {
   console.log("failure!");
   console.log(error);
   return false;

}).then((res) => {
   process.exit(0);

}, (e) => {
   console.log(e.stack);
   process.exit(1);
});

