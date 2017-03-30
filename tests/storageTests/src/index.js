'use strict'

import { 
   create_datastore,
   delete_datastore,
   get_datastore,
   datastore_mkdir,
   datastore_rmdir,
   datastore_listdir,
   datastore_getfile,
   datastore_putfile,
   datastore_deletefile,
   datastore_stat,
   get_or_create_datastore
} from './testlib';

import {
   datastore_get_id,
   decode_privkey,
} from '../../../lib/storage';

import {
   make_inode_header_blob
} from '../../../lib/storage';

import {
   getCoreSession,
   makeAuthRequest
} from '../../../lib/auth';

const assert = require('assert');
const bitcoinjs = require('bitcoinjs-lib');
const http = require('http');
const jsontokens = require('jsontokens');
const BigInteger = require('bigi');
const Promise = require('promise');

var args = process.argv.slice(2);
var command = null;
if( args.length == 0 ) {
   command = "unittest";
}
else {
   command = args[0];
}

var res = null;

function dir_expect(dir, names) {
   for (var name of names) {
      if( !Object.keys(dir).includes(name) ) {
         return false;
      }
   }
   return true;
}

function stat_dir(ds_str, dir_path, expect_error) {
   return datastore_stat(ds_str, dir_path).then(
   (inode) => {
        console.log(`stat dir ${dir_path} got result: ${JSON.stringify(inode)}`);
        if( inode.error || !inode ) {
           if( expect_error ) {
              return true;
           }
           else {
              console.log(inode.error);
              return false;
           }
        }

        if( inode.type != 2 ) {
           console.log(inode);
           return false;
        }

        return true;
   },
   (error) => {
        console.log(`stat ${dir_path} failed`);
        console.log(error);
        console.log(JSON.stringify(error));
        return false;
   });
}

function stat_file(ds_str, file_path, expect_error) {
   return datastore_stat(ds_str, file_path).then(
   (inode) => {
        console.log(`stat file ${file_path} got result: ${JSON.stringify(inode)}`);
        if( inode.error || !inode ) {
           if( expect_error ) {
              return true;
           }
           else {
              console.log(inode.error);
              return false;
           }
        }

        if( inode.type != 1 ) {
           console.log(inode);
           return false;
        }

        return true;
   },
   (error) => {
        console.log(`stat ${file_path} failed`);
        console.log(error);
        console.log(JSON.stringify(error));
        return false;
   });
}


function file_expect(ds_str, file_path, content) {
   return datastore_getfile(ds_str, file_path).then(
   (idata) => {
        console.log(`getfile ${file_path} got result: ${JSON.stringify(idata)}`);
        if( idata.error || !idata ) {
           if( expect_error ) {
              return true;
           }
           else {
              console.log(idata.error);
              return false;
           }
        }
        
        if( idata != content ) {
           console.log(`expected ${content}; got ${idata}`);
        }

        return true;
   },
   (error) => {
        console.log(`getfile ${file_path} failed`);
        console.log(error);
        console.log(JSON.stringify(error));
        return false;
   });
}


function http_request(options) {

   var p = new Promise(function(resolve, reject) {
      http.request(options, function(response) {    
         var strbuf = [];
         response.on('data', function(chunk) {
            strbuf.push(chunk);
         });

         response.on('end', function() {
            if( response.statusCode != 200 ) {
               return reject("HTTP Status " + response.statusCode);
            }

            var str = Buffer.concat(strbuf).toString();
            var resp = JSON.parse(str);
            str = null;
            strbuf = null;
              
            resolve(resp);
         });

         response.on('error', function() {
            reject(resp);
         });
      }).end();
   });
   return p;
}


function get_session_token(host, port, ds_private_key_hex, api_password) {
   var ds_privkey = BigInteger.fromHex(ds_private_key_hex);
   var ds_public_key = new bitcoinjs.ECPair(ds_privkey).getPublicKeyBuffer().toString('hex');

   var auth_request = {
      'app_domain': 'blockstack-storage-test-js',
      'methods': ['store_read', 'store_write', 'store_admin'],
      'app_public_key': ds_public_key,
   };

   var ts = new jsontokens.TokenSigner('ES256k', ds_private_key_hex);
   var signed_auth_request = ts.sign(auth_request);

   var options = {
      'method': 'GET',
      'host': host,
      'port': port,
      'path': `/v1/auth?authRequest=${signed_auth_request}`,
      'headers': {
         'Authorization': `bearer ${api_password}`
      }
   };

   return http_request(options);
}

function node_ping(host, port) {
   var options = {
      'method': 'GET',
      'host': host,
      'port': port,
      'path': '/v1/node/ping',
   };

   return http_request(options);
}


if( command == 'create_datastore' ) { 
   assert(args.length >= 5);
   res = create_datastore(args[1], args[2], args[3], args[4], args[5])
}
else if( command == 'delete_datastore') {
   assert(args.length >= 2);
   res = delete_datastore(args[1]);
}
else if( command == 'get_datastore') {
   assert(args.length >= 5);
   res = get_datastore(args[1], args[2], args[3], args[4]);
}
else if( command == 'mkdir' ) {
   assert(args.length >= 3);
   res = datastore_mkdir(args[1], args[2], args[3], args[4]);
}
else if( command == 'rmdir' ) {
   assert(args.length >= 3);
   res = datastore_rmdir(args[1], args[2], args[3], args[4]);
}
else if( command == 'listdir' ) {
   assert(args.length >= 3 );
   res = datastore_listdir(args[1], args[2], args[3], args[4]);
}
else if( command == 'getfile' ) {
   assert(args.length >= 3);
   res = datastore_getfile(args[1], args[2], args[3], args[4]);
}
else if( command == 'putfile' ) {
   assert(args.length >= 4);
   res = datastore_putfile(args[1], args[2], args[3], args[4], args[5]);
}
else if( command == 'deletefile' ) {
   assert(args.length >= 3);
   res = datastore_deletefile(args[1], args[2]);
}
else if( command == 'stat' ) {
   assert(args.length >= 3 );
   res = datastore_stat(args[1], args[2]);
}
else if( command == 'unittest' ) {
   var hdr = make_inode_header_blob("1BjnYXfXbh84Xrc24zM1GFvCrXenp8AqUZ", 2, "1BjnYXfXbh84Xrc24zM1GFvCrXenp8AqUZ", "86ce29a7-0714-4136-bfbc-d48f2e55afd4", "9ceb6a079746a67defdadd7ad19a4c9e070a7e5dd2d41df9fc6e3d289e8e49c4", "c429b777-c7b9-4e07-99ba-7cdf98a283c3", 1);
      
   var api_password = "blockstack_integration_test_api_password";
   var device_id = 'c429b777-c7b9-4e07-99ba-7cdf98a283c3';
   var datastore_privkey = bitcoinjs.ECPair.makeRandom();
   var datastore_privkey_hex = datastore_privkey.d.toBuffer().toString('hex');
   var datastore_pubkey_hex = datastore_privkey.getPublicKeyBuffer().toString('hex');
   var datastore_id = datastore_get_id(datastore_pubkey_hex);
   var res = null;
   var datastore = null;
   var datastore_str = null;
   var session_token = null;
  
   console.log(`private key is ${datastore_privkey_hex}`);
   console.log(`public key is ${datastore_pubkey_hex}`);
   console.log("begin ping");

   node_ping('localhost', 16268)
      .then((res) => {

           console.log(`ping result: ${JSON.stringify(res)}`);

           var auth_request = makeAuthRequest(datastore_privkey_hex, "https://www.foo.com", "https://www.foo.com/manifest.json", "https://www.foo.com/login", ['store_read', 'store_write', 'store_admin']);
           return getCoreSession('localhost', 16268, api_password, datastore_privkey_hex, "judecn.id", auth_request);

      }, (error) => {console.log(JSON.stringify(error)); process.exit(1);})
      .then((token_res) => {
            
           console.log(`session result: ${JSON.stringify(token_res)}`);
           session_token = token_res;
           if( !session_token ) {
              console.log("failed to authenticate");
              process.exit(1);
           }

           return get_or_create_datastore("localhost:16268", datastore_privkey_hex, session_token, device_id, [device_id], ['disk']);

      }, (error) => {console.log("get session token failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {
       
           console.log(`get_or_create_datastore (create) result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              process.exit(1);
           }
        
           // make sure it's idempotent
           return get_or_create_datastore("localhost:16268", datastore_privkey_hex, session_token, device_id, [device_id], ['disk']);

      }, (error) => {console.log("get_or_create_datastore (create) failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`get_or_create_datastore (get) result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              console.log("exiting");
              process.exit(1);
           }

           datastore = res.datastore;
           datastore_str = JSON.stringify(res);

           return datastore_mkdir(datastore_str, '/dir1');

      }, (error) => {console.log("get_or_create_datastore (get) failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_mkdir result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              console.log(JSON.stringify(res.error));
              console.log("exiting");
              process.exit(1);
           }

           return datastore_mkdir(datastore_str, '/dir1/dir2');

      }, (error) => {console.log("mkdir /dir1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_mkdir result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              process.exit(1);
           }

           return datastore_putfile(datastore_str, '/file1', "hello world");

      }, (error) => {console.log("mkdir /dir1/dir2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_putfile result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              process.exit(1);
           }

           return datastore_putfile(datastore_str, '/dir1/file2', "hello world 2");

      }, (error) => {console.log("putfile /file1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_putfile result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              process.exit(1);
           }

           return datastore_putfile(datastore_str, '/dir1/dir2/file3', 'hello world 3');

      }, (error) => {console.log("putfile /dir1/file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_putfile result: ${JSON.stringify(res)}`);
           if( res.error ) {
              console.log(res);
              process.exit(1);
           }

           return datastore_listdir(datastore_str, '/');

      }, (error) => {console.log("putfile /dir1/dir2/file3 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_listdir result: ${JSON.stringify(res)}`);
           if( !res || res.error) {
              console.log(res);
              process.exit(1);
           }

           if( !dir_expect(res, ['dir1', 'file1']) ) {
              console.log("Missing dir1 or file1");
              console.log(res);
              process.exit(1);
           }

           return datastore_listdir(datastore_str, '/dir1');

      }, (error) => {console.log("listdir / failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`datastore_listdir result: ${JSON.stringify(res)}`);
           if( !res || res.error) {
              console.log(res);
              process.exit(1);
           }

           if( !dir_expect(res, ['dir2', 'file2']) ) {
              console.log("Missing dir2 or file2");
              console.log(res);
              process.exit(1);
           }

           return stat_dir(datastore_str, '/');
      
      }, (error) => {console.log("listdir /dir1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_dir result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return stat_dir(datastore_str, '/dir1');
      
      }, (error) => {console.log("stat dir / failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_dir result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return stat_dir(datastore_str, '/dir1/dir2');
      
      }, (error) => {console.log("stat dir /dir1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_dir result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/file1');
      
      }, (error) => {console.log("stat dir /dir1/dir2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/dir1/file2');
      
      }, (error) => {console.log("stat file /file1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/dir1/dir2/file3');
      
      }, (error) => {console.log("stat file /dir1/file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return file_expect(datastore_str, '/file1', 'hello world');
      
      }, (error) => {console.log("stat file /dir1/dir2/file3 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`file_expect result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return file_expect(datastore_str, '/dir1/file2', 'hello world 2');
      
      }, (error) => {console.log("get file /file1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`file_expect result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           return file_expect(datastore_str, '/dir1/dir2/file3', 'hello world 3');
      
      }, (error) => {console.log("get file /dir1/file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`file_expect result: ${JSON.stringify(res)}`);
           if( !res || res.error) {
              process.exit(1);
           }
           return datastore_deletefile(datastore_str, '/file1');

      }, (error) => {console.log("get file /dir1/dir2/file3 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`deletefile result: ${JSON.stringify(res)}`);
           if( !res || res.error) {
              process.exit(1);
           }
           return datastore_deletefile(datastore_str, '/dir1/file2');

      }, (error) => {console.log("delete file /file1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`deletefile result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return datastore_deletefile(datastore_str, '/dir1/dir2/file3');

      }, (error) => {console.log("delete file /dir1/file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`deletefile result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/file1', true);
      
      }, (error) => {console.log("delete file /dir1/dir2/file3 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result (expect failure): ${JSON.stringify(res)}`);
           if( !res || res.error) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/dir1/file2', true);
      
      }, (error) => {console.log("stat /file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result (expect failure): ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return stat_file(datastore_str, '/dir1/dir2/file3', true);
      
      }, (error) => {console.log("stat file /dir1/file2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_file result (expect failure): ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return datastore_rmdir(datastore_str, '/dir1/dir2');

      }, (error) => {console.log("stat file /dir1/dir2/file3 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`rmdir result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return datastore_rmdir(datastore_str, '/dir1');

      }, (error) => {console.log("rmdir /dir1/dir2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`rmdir result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return stat_dir(datastore_str, '/dir1', true);
      
      }, (error) => {console.log("rmdir /dir1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_dir result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
           return stat_dir(datastore_str, '/dir1/dir2', true);
      
      }, (error) => {console.log("stat dir /dir1 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`stat_dir result: ${JSON.stringify(res)}`);
           if( !res || res.error ) {
              process.exit(1);
           }
            
           return delete_datastore(datastore_str);
      }, (error) => {console.log("stat dir /dir1/dir2 failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);})
      .then((res) => {

           console.log(`delete datastore result: ${JSON.stringify(res)}`);
           if( !res ) {
              process.exit(1);
           }
           process.exit(0);
      }, (error) => {console.log("delete datastore failed:"); console.log(error); console.log(JSON.stringify(error)); process.exit(1);});
}
else {
   console.log("No command given");
   console.log(`args = ${args}`);
   console.log(`command = ${command}`);
   assert(0);
}
