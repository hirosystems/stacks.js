'use strict'

import {
   encode_signature,
} from '../inode';

import test from 'tape';

export function inode_tests() {

   signature_payloads = [
      [0, 0, '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
      [256, 512, '00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200'],
   ];

   test('signature encoding', (t) => {
      t.plan(signature_payloads.length);

      for (payload_info of signature_payloads) {
         r = payload_info[0];
         s = payload_info[1];
         expected_out = payload_info[2];

         t.ok( expected_out == encode_signature(r,s) );
      }
   });
}
