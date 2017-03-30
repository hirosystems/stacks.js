'use strict'

import {json_stable_serialize} from '../util';
import test from 'tape';

/*
 * Check object equality recursive.
 * Works only for objects composed of primitive types.
 * sourced from http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
 */
function objeq(a, b) {
    if( a == b ) {
       return true;
    }

    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if( !objeq(a[propName], b[propName]) ) {
           return false;
        }
    }

    return true;
}


export function json_stable_serialize_tests() {
    
   const serializable_objects = [
      '',
      1,
      true,
      'hello',
      [],
      [1, 2],
      {},
      {'a': 'b'},
      {'a': 1, 'b': '2'},
      ['1', '2', '3'],
      [1, 2, 3],
      [{'a': 'b'}, {'c': 'd'}],
      [{'a': [1, 2, 3], 'b': [4, 5, 6]}],
      {'c': [{'a': 1, 'c': 2, 'b': 3}, {'f': 4, 'e': 5, 'd': 6}], 'a': [4, 1, 2, 3, '4', '5', '6'], 'd': true, 'b': 'false'}
   ];
    
   test('serialize and deserialize JSON', (t) => {
      t.plan(serializable_objects.length);


      for (var serializable_obj of serializable_objects) {
          console.log(`object: ${serializable_obj}`);
          
          const jsonstr = json_stable_serialize(serializable_obj);
          console.log(`jsonstr: ${jsonstr}`);

          const reloaded_obj = JSON.parse(jsonstr);
          console.log(`reload: ${reloaded_obj}`);
          
          t.ok(objeq(reloaded_obj, serializable_obj), 'deserialized serialized object must equal the original object')
      }
   });
}

