import { bytesToHex, concatBytes, equals, utf8ToBytes } from '@stacks/common';
import { decodeMessage, encodeMessage, hashMessage } from '../src/messageSignature';

test('encodeMessage / decodeMessage', () => {
  // array of messages and their expected encoded message
  const messages = [
    ['hello world', '\x17Stacks Signed Message:\n\x0bhello world'],
    ['', '\x17Stacks Signed Message:\n\x00'],
    // Longer message (to test a different length for the var_int prefix)
    [
      'This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix',
      concatBytes(
        utf8ToBytes('\x17Stacks Signed Message:\n'),
        // message length = 284 (decimal) = 011c (hex) <=> \x1c\x01 (little endian encoding)
        // Since length = 284 is < 0xFFFF, prefix the int with 0xFD followed by 2 bytes for a total of 3 bytes (see https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer)
        new Uint8Array([253, 28, 1]),
        utf8ToBytes(
          'This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix This is a really long message to test the var_int prefix'
        )
      ),
    ],
  ];
  for (const messageArr of messages) {
    const [message, expected] = messageArr;
    const encodedMessage = encodeMessage(message);
    const expectedBytes = typeof expected == 'string' ? utf8ToBytes(expected) : expected;
    expect(equals(encodedMessage, expectedBytes)).toBeTruthy();

    const decodedMessage = decodeMessage(encodedMessage);
    expect(decodedMessage).toEqual(typeof message == 'string' ? utf8ToBytes(message) : message);
  }
});

test('hash message vs hash of manually constructed message', () => {
  // echo -n '\x17Stacks Signed Message:\n\x0bhello world' | openssl dgst -sha256
  // 619997693db23de4b92ed152444a578a134143d9ad2c0f4dff2615de9d42ad96

  const message1 = 'hello world';
  const hash1 = hashMessage(message1);
  const expectedHash = '619997693db23de4b92ed152444a578a134143d9ad2c0f4dff2615de9d42ad96';
  expect(hash1.length).toEqual(32); // 32 bytes of sha256
  expect(bytesToHex(hash1)).toEqual(expectedHash);
});
