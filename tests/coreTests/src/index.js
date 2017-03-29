import {
    getCoreSession,
    makeAuthRequest   
} from '../../../lib';

var privk_client = '8b13483d65e55eb2184ff7c9978379eff2fae7ad40da09ae4e3e5cf84b36a550';
var privk_app = '99c01d085f7914e4725ffa3160df583c37cc27e1e7fd48f2d6e17d4a9a4ba55e';
var api_pass = "asdfasdfasdfasdf"

var auth_request = makeAuthRequest(privk_client, "www.foo.com", "www.foo.com/manifest.json", "www.foo.com/login", ['store_read', 'store_write', 'store_admin']);

getCoreSession("localhost", 6270, api_pass, privk_app, "judecn.id", auth_request)
.then((session) => {
   console.log("success!");
   console.log(session);
}, (error) => {
   console.log("failure!");
   console.log(error);
});

