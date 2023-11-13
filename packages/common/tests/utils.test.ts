import {
  isSameOriginAbsoluteUrl,
  isLaterVersion,
  intToHex,
  hexToBytes,
  bytesToHex,
  fromTwos,
  toTwos,
  bigIntToBytes,
  intToBigInt,
  validateHash256,
} from '../src';
import BN from 'bn.js';

test('isLaterVersion', () => {
  expect(isLaterVersion('', '1.1.0')).toEqual(false);
  expect(isLaterVersion('1.2.0', '1.1.0')).toEqual(true);
  expect(isLaterVersion('1.1.0', '1.1.0')).toEqual(true);
  expect(isLaterVersion('1.1.0', '1.2.0')).toEqual(false);
});

test('isSameOriginAbsoluteUrl', () => {
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/')).toEqual(true);
  expect(isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/')).toEqual(true);
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/manifest.json')).toEqual(
    true
  );
  expect(
    isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/manifest.json')
  ).toEqual(true);
  expect(
    isSameOriginAbsoluteUrl('http://localhost:3000', 'http://localhost:3000/manifest.json')
  ).toEqual(true);
  expect(
    isSameOriginAbsoluteUrl('http://app.example.com', 'http://app.example.com/manifest.json')
  ).toEqual(true);
  expect(
    isSameOriginAbsoluteUrl('http://app.example.com:80', 'http://app.example.com/manifest.json')
  ).toEqual(true);
  expect(
    isSameOriginAbsoluteUrl(
      'https://app.example.com:80',
      'https://app.example.com:80/manifest.json'
    )
  ).toEqual(true);

  expect(isSameOriginAbsoluteUrl('http://example.com', 'https://example.com/')).toEqual(false);
  expect(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com:1234')).toEqual(false);
  expect(
    isSameOriginAbsoluteUrl('http://app.example.com', 'https://example.com/manifest.json')
  ).toEqual(false);
});

test('intToHex', () => {
  const expected = '0000000000000010';

  expect(intToHex(BigInt(16))).toEqual(expected);
  expect(intToHex(16)).toEqual(expected);
});

test('hexToBytes & bytesToHex', () => {
  const hex = 'ff';
  const bytes = Uint8Array.of(255);

  expect(hexToBytes(hex)).toEqual(bytes);
  expect(bytesToHex(bytes)).toEqual(hex);
});

test('should return proper Uint8Array', () => {
  const n = BigInt('0x123456');

  expect(bytesToHex(bigIntToBytes(n, 5))).toBe('0000123456');

  const s = '211e1566be78319bb949470577c2d4';

  for (let i = 1; i <= s.length; i++) {
    const slice = (i % 2 === 0 ? '' : '0') + s.slice(0, i);
    const bn = BigInt(`0x${slice}`);
    expect(bytesToHex(bigIntToBytes(bn))).toBe(slice.padStart(32, '0'));
  }
});

test('fromTwos', () => {
  expect(Number(fromTwos(BigInt('0x00000000'), BigInt(32)))).toBe(0);
  expect(Number(fromTwos(BigInt('0x00000001'), BigInt(32)))).toBe(1);
  expect(Number(fromTwos(BigInt('0x7fffffff'), BigInt(32)))).toBe(2147483647);
  expect(Number(fromTwos(BigInt('0x80000000'), BigInt(32)))).toBe(-2147483648);
  expect(Number(fromTwos(BigInt('0xf0000000'), BigInt(32)))).toBe(-268435456);
  expect(Number(fromTwos(BigInt('0xf1234567'), BigInt(32)))).toBe(-249346713);
  expect(Number(fromTwos(BigInt('0xffffffff'), BigInt(32)))).toBe(-1);
  expect(Number(fromTwos(BigInt('0xfffffffe'), BigInt(32)))).toBe(-2);
  expect(Number(fromTwos(BigInt('0xfffffffffffffffffffffffffffffffe'), BigInt(128)))).toBe(-2);
  expect(
    Number(
      fromTwos(
        BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'),
        BigInt(256)
      )
    )
  ).toBe(-2);
  expect(
    Number(
      fromTwos(
        BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        BigInt(256)
      )
    )
  ).toBe(-1);
  expect(
    fromTwos(
      BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      BigInt(256)
    ).toString(10)
  ).toEqual(
    BigInt(
      '57896044618658097711785492504343953926634992332820282019728792003956564819967'
    ).toString(10)
  );
  expect(
    fromTwos(
      BigInt('0x8000000000000000000000000000000000000000000000000000000000000000'),
      BigInt(256)
    ).toString(10)
  ).toEqual(
    BigInt(
      '-57896044618658097711785492504343953926634992332820282019728792003956564819968'
    ).toString(10)
  );
});

test('toTwos', () => {
  expect(toTwos(BigInt(0), BigInt(32)).toString(16)).toEqual('0');
  expect(toTwos(BigInt(1), BigInt(32)).toString(16)).toEqual('1');
  expect(toTwos(BigInt(2147483647), BigInt(32)).toString(16)).toEqual('7fffffff');
  expect(toTwos(BigInt(-2147483648), BigInt(32)).toString(16)).toEqual('80000000');
  expect(toTwos(BigInt(-268435456), BigInt(32)).toString(16)).toEqual('f0000000');
  expect(toTwos(BigInt(-249346713), BigInt(32)).toString(16)).toEqual('f1234567');
  expect(toTwos(BigInt(-1), BigInt(32)).toString(16)).toEqual('ffffffff');
  expect(toTwos(BigInt(-2), BigInt(32)).toString(16)).toEqual('fffffffe');
  expect(toTwos(BigInt(-2), BigInt(128)).toString(16)).toEqual('fffffffffffffffffffffffffffffffe');
  expect(toTwos(BigInt(-2), BigInt(256)).toString(16)).toEqual(
    'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
  );
  expect(toTwos(BigInt(-1), BigInt(256)).toString(16)).toEqual(
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );
  expect(
    toTwos(
      BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819967'),
      BigInt(256)
    ).toString(16)
  ).toEqual('7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  expect(
    toTwos(
      BigInt('-57896044618658097711785492504343953926634992332820282019728792003956564819968'),
      BigInt(256)
    ).toString(16)
  ).toEqual('8000000000000000000000000000000000000000000000000000000000000000');
});

test('Should accept bn.js instance', () => {
  const value = '123456';
  const bn = new BN(value);
  // After removing bn.js library verify backward compatibility for users passing bn.js instance
  // Should not break if bn.js instance is passed
  const nativeBigInt = intToBigInt(bn, false);

  expect(nativeBigInt.toString()).toEqual(value);
});

describe(validateHash256, () => {
  const TXID = '117a6522b4e9ec27ff10bbe3940a4a07fd58e5352010b4143992edb05a7130c7';

  test.each([
    { txid: TXID, expected: true }, // without 0x
    { txid: `0x${TXID}`, expected: true }, // with 0x
    { txid: TXID.split('30c7')[0], expected: false }, // too short
    {
      txid: 'Failed to deserialize posted transaction: Invalid Stacks string: non-printable or non-ASCII string',
      expected: false, // string without txid
    },
    {
      txid: `Failed to deserialize posted transaction: Invalid Stacks string: non-printable or non-ASCII string. ${TXID}`,
      expected: false, // string with txid
    },
  ])('txid is validated as hash 256', ({ txid, expected }) => {
    expect(validateHash256(txid)).toEqual(expected);
  });
});
