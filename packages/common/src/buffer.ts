/** @ignore */
export function equals(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * @ignore
 * TODO: maybe remove and use string repeat
 */
export function alloc(length: number, value: number) {
  const a = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    a[i] = value;
  }
  return a;
}

/** @ignore */
export function readUInt16BE(source: Uint8Array, offset: number): number {
  return ((source[offset + 0] << 8) | source[offset + 1]) >>> 0;
}

/** @ignore */
export function writeUInt16BE(destination: Uint8Array, value: number, offset = 0): Uint8Array {
  destination[offset + 0] = value >>> 8;
  destination[offset + 1] = value >>> 0;
  return destination;
}

// The following methods are based on `microsoft/vscode` implementation
// https://github.com/microsoft/vscode/blob/1e6ac12df197fc3e5d1c1bdb25702125cccb135a/src/vs/base/common/buffer.ts

// Copyright (c) 2015 - present Microsoft Corporation
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the “Software”), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

/** @ignore */
export function readUInt8(source: Uint8Array, offset: number): number {
  return source[offset];
}

/** @ignore */
export function writeUInt8(destination: Uint8Array, value: number, offset = 0): Uint8Array {
  destination[offset] = value;
  return destination;
}

/** @ignore */
export function readUInt16LE(source: Uint8Array, offset: number): number {
  return ((source[offset + 0] << 0) >>> 0) | ((source[offset + 1] << 8) >>> 0);
}

/** @ignore */
export function writeUInt16LE(destination: Uint8Array, value: number, offset = 0): Uint8Array {
  destination[offset + 0] = value & 0b1111_1111;
  value >>>= 8;
  destination[offset + 1] = value & 0b1111_1111;
  return destination;
}

/** @ignore */
export function readUInt32BE(source: Uint8Array, offset: number): number {
  return (
    source[offset] * 2 ** 24 +
    source[offset + 1] * 2 ** 16 +
    source[offset + 2] * 2 ** 8 +
    source[offset + 3]
  );
}

/** @ignore */
export function writeUInt32BE(destination: Uint8Array, value: number, offset = 0): Uint8Array {
  destination[offset + 3] = value;
  value >>>= 8;
  destination[offset + 2] = value;
  value >>>= 8;
  destination[offset + 1] = value;
  value >>>= 8;
  destination[offset] = value;
  return destination;
}

/** @ignore */
export function readUInt32LE(source: Uint8Array, offset: number): number {
  return (
    ((source[offset + 0] << 0) >>> 0) |
    ((source[offset + 1] << 8) >>> 0) |
    ((source[offset + 2] << 16) >>> 0) |
    ((source[offset + 3] << 24) >>> 0)
  );
}

/** @ignore */
export function writeUInt32LE(destination: Uint8Array, value: number, offset = 0): Uint8Array {
  destination[offset + 0] = value & 0b1111_1111;
  value >>>= 8;
  destination[offset + 1] = value & 0b1111_1111;
  value >>>= 8;
  destination[offset + 2] = value & 0b1111_1111;
  value >>>= 8;
  destination[offset + 3] = value & 0b1111_1111;
  return destination;
}
