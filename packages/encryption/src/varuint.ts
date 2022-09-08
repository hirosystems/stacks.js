import {
  readUInt16LE,
  readUInt32LE,
  readUInt8,
  writeUInt16LE,
  writeUInt32LE,
  writeUInt8,
} from '@stacks/common';

// The following methods are based on `bitcoinjs/varuint-bitcoin` implementation
// https://github.com/bitcoinjs/varuint-bitcoin/blob/8342fe7362f20a412d61b9ade20839aafaa7f78e/index.js

// Copyright (c) 2016 Kirill Fomichev
// Parts of this software are based on https://github.com/mappum/bitcoin-protocol
// Copyright (c) 2016 Matt Bell
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the “Software”), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// Number.MAX_SAFE_INTEGER
const MAX_SAFE_INTEGER = 9_007_199_254_740_991;

function ensureUInt53(n: number) {
  if (n < 0 || n > MAX_SAFE_INTEGER || n % 1 !== 0) throw new RangeError('value out of range');
}

export function encode(number: number, bytes?: Uint8Array, offset: number = 0) {
  ensureUInt53(number);
  if (!bytes) bytes = new Uint8Array(encodingLength(number));

  // 8 bit
  if (number < 0xfd) {
    writeUInt8(bytes, number, offset);

    // 16 bit
  } else if (number <= 0xff_ff) {
    writeUInt8(bytes, 0xfd, offset);
    writeUInt16LE(bytes, number, offset + 1);

    // 32 bit
  } else if (number <= 0xff_ff_ff_ff) {
    writeUInt8(bytes, 0xfe, offset);
    writeUInt32LE(bytes, number, offset + 1);

    // 64 bit
  } else {
    writeUInt8(bytes, 0xff, offset);
    writeUInt32LE(bytes, number >>> 0, offset + 1);
    writeUInt32LE(bytes, (number / 0x1_00_00_00_00) | 0, offset + 5);
  }

  return bytes;
}

export function decode(bytes: Uint8Array, offset: number = 0) {
  const first = readUInt8(bytes, offset);

  // 8 bit
  if (first < 0xfd) {
    return first;

    // 16 bit
  } else if (first === 0xfd) {
    return readUInt16LE(bytes, offset + 1);

    // 32 bit
  } else if (first === 0xfe) {
    return readUInt32LE(bytes, offset + 1);

    // 64 bit
  } else {
    const lo = readUInt32LE(bytes, offset + 1);
    const hi = readUInt32LE(bytes, offset + 5);
    const number = hi * 0x01_00_00_00_00 + lo;
    ensureUInt53(number);

    return number;
  }
}

export function encodingLength(number: number) {
  ensureUInt53(number);

  return number < 0xfd ? 1 : number <= 0xff_ff ? 3 : number <= 0xff_ff_ff_ff ? 5 : 9;
}
