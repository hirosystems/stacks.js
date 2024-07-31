import { bytesToHex, concatBytes, equals, utf8ToBytes } from '@stacks/common';
import { STACKS_TESTNET } from '@stacks/network';
import { getAddressFromPublicKey } from '@stacks/transactions';
import { verifyMessageSignatureRsv } from '../src/ec';
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

test('message signing complete flow', () => {
  const LEGACY_PREFIX = '\x18Stacks Message Signing:\n';

  const message = 'You are saying that you want to perform action XYZ.';
  const address = 'STGSJA8EMYDBAJDX6Z4ED8CWW071B6NB97SRAM1E';
  const publicKey = '024cce41b91566d70ec2ed6eb161c6ef9c277bdc034738318ed06f1d5ba09546d6';

  const hash1 = '650ff1a80ea3fab019b383d4385fcc52bb4d1cbce4713f3e95889013be3569a5';
  const signature1 =
    '29ef6d718235e5fc32a1b90dd8fc7fa9403fa1b55c2dce46374570b7f3a4815d0215b8565f29a33ef8132dc0db6b00a5f13d85d6aff5c1171271818b9928928c01';

  const hash2 = '1a92e7334e5e0ffc9b5792e379895b829598bf16fe8a771dc724e8ebfb6ed5e9';
  const signature2 =
    'ab7d5f728dfc6daf0511bf292f981ae44c2ffb6f5fa1adf1db28580aeb9418903c28ddc87ede66ef4091c1df03ef4348b22de1f34b8581ab820d0d93a266115300';

  expect(bytesToHex(hashMessage(message))).toBe(hash1);
  expect(bytesToHex(hashMessage(message, '\x17Stacks Signed Message:\n'))).toBe(hash1);
  expect(bytesToHex(hashMessage(message, LEGACY_PREFIX))).toBe(hash2);

  expect(
    verifyMessageSignatureRsv({
      message,
      publicKey,
      signature: signature1,
    })
  ).toBe(true);
  expect(
    verifyMessageSignatureRsv({
      message,
      publicKey,
      signature: signature2,
    })
  ).toBe(true);

  expect(getAddressFromPublicKey(publicKey, STACKS_TESTNET)).toBe(address);
});
