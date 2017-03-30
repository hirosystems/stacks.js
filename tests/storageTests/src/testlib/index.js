'use strict'

const datastore = require('../../../../lib/storage');

// create a datastore
export function create_datastore( privkey, session, device_id, all_device_ids, drivers ) {

   // will be a stringified array
   all_device_ids = JSON.parse(all_device_ids);

   if( drivers ) {
       drivers = JSON.parse(drivers);
   }
   else {
       drivers = ['disk'];
   }

   console.log(`create_datastore(${privkey}, ${session}, ${device_id}, ${all_device_ids})`);

   var info = datastore.datastore_create_mkinfo('datastore', privkey, drivers, device_id, all_device_ids );
   var res = datastore.datastore_create( 'localhost:6270', session, info );
   return res;
}


// get a datastore 
export function get_datastore(session, datastore_id, privkey, device_id) {

   console.log(`get_datastore(${session}, ${datastore_id}, ${privkey}, ${device_id}`);
   var res = datastore.datastore_connect( 'localhost:6270', session, privkey, device_id );
   return res;
}


// get or create 
export function get_or_create_datastore( hostport, privkey, session, this_device_id, all_device_ids, drivers ) {
   console.log(`get_or_create_datastore(${hostport}, ${privkey}, ${session}, ${this_device_id}, ${all_device_ids}, ${drivers})`);
   return datastore.datastore_get_or_create(hostport, privkey, session, this_device_id, all_device_ids, drivers);
}

// delete datastore 
export function delete_datastore(ds_str) {

   // ds will be JSON-string 
   var ds = JSON.parse(ds_str);

   console.log(`delete_datastore(${ds.privkey_hex}`);
   var info = datastore.datastore_delete_mkinfo(ds);
   return datastore.datastore_delete(ds, info['datastore_tombstones'], info['root_tombstones']);
}


// getfile 
export function datastore_getfile(ds_str, path, extended, force) {

   // ds will be JSON-string 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`getfile(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.getfile(ds, path, opts);
}


// putfile 
export function datastore_putfile(ds_str, path, data_str, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var data_buf = Buffer.from(ds_str);

   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`putfile(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.putfile(ds, path, Buffer.from(data_str), opts);
}


// deletefile
export function datastore_deletefile(ds_str, path, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`deletefile(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.deletefile(ds, path, opts);
}


// mkdir 
export function datastore_mkdir(ds_str, path, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`mkdir(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.mkdir(ds, path, opts);
}


// listdir 
export function datastore_listdir(ds_str, path, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`listdir(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.listdir(ds, path, opts);
}


// rmdir 
export function datastore_rmdir(ds_str, path, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`rmdir(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.rmdir(ds, path, opts);
}


// stat
export function datastore_stat(ds_str, path, extended, force) {

   // ds will be a json str 
   var ds = JSON.parse(ds_str);
   var extended = (extended == '1');
   var force = (force == '1');

   var opts = {
      'extended': extended,
      'force': force,
   };

   console.log(`stat(${ds.privkey_hex}, ${path}, ${extended}, ${force})`);
   return datastore.stat(ds, path, opts);
}
