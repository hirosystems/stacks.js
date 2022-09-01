import {
  asciiToBytes,
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  hexToBytes,
  utf8ToBytes,
} from '@stacks/common';
import { ByteReader } from '../src/bytesReader';
import {
  bufferCV,
  BufferCV,
  ClarityValue,
  contractPrincipalCV,
  contractPrincipalCVFromStandard,
  deserializeCV,
  falseCV,
  IntCV,
  intCV,
  listCV,
  ListCV,
  noneCV,
  responseErrorCV,
  responseOkCV,
  serializeCV,
  someCV,
  SomeCV,
  standardPrincipalCV,
  StandardPrincipalCV,
  standardPrincipalCVFromAddress,
  stringAsciiCV,
  StringAsciiCV,
  stringUtf8CV,
  StringUtf8CV,
  trueCV,
  tupleCV,
  TupleCV,
  uintCV,
  UIntCV,
} from '../src/clarity';
import { cvToJSON, cvToString, cvToValue, getCVTypeString } from '../src/clarity/clarityValue';
import { addressToString } from '../src/common';
import { deserializeAddress } from '../src/types';

const ADDRESS = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';

function serializeDeserialize<T extends ClarityValue>(value: T): ClarityValue {
  const serializedDeserialized: Uint8Array = serializeCV(value);
  const bufferReader = new ByteReader(serializedDeserialized);
  return deserializeCV(bufferReader);
}

describe('Clarity Types', () => {
  test('Deserialize with type generics', () => {
    const serializedClarityValue =
      '0x0c00000003096e616d6573706163650200000003666f6f0a70726f706572746965730c000000061963616e2d7570646174652d70726963652d66756e6374696f6e030b6c61756e636865642d61740a0100000000000000000000000000000006086c69666574696d65010000000000000000000000000000000c106e616d6573706163652d696d706f7274051a164247d6f2b425ac5771423ae6c80c754f7172b00e70726963652d66756e6374696f6e0c0000000504626173650100000000000000000000000000000001076275636b6574730b00000010010000000000000000000000000000000101000000000000000000000000000000010100000000000000000000000000000001010000000000000000000000000000000101000000000000000000000000000000010100000000000000000000000000000001010000000000000000000000000000000101000000000000000000000000000000010100000000000000000000000000000001010000000000000000000000000000000101000000000000000000000000000000010100000000000000000000000000000001010000000000000000000000000000000101000000000000000000000000000000010100000000000000000000000000000001010000000000000000000000000000000105636f6566660100000000000000000000000000000001116e6f2d766f77656c2d646973636f756e740100000000000000000000000000000001116e6f6e616c7068612d646973636f756e7401000000000000000000000000000000010b72657665616c65642d61740100000000000000000000000000000003067374617475730d000000057265616479';

    // The old way of deserializing without type generics - verbose, hard to read, frustrating to define 🤢
    function parseWithManualTypeAssertions() {
      const deserializedCv = deserializeCV(serializedClarityValue);
      const clVal = deserializedCv as TupleCV;
      const namespaceCV = clVal.data['namespace'] as BufferCV;
      const statusCV = clVal.data['status'] as StringAsciiCV;
      const properties = clVal.data['properties'] as TupleCV;
      const launchedAtCV = properties.data['launched-at'] as SomeCV;
      const launchAtIntCV = launchedAtCV.value as UIntCV;
      const lifetimeCV = properties.data['lifetime'] as IntCV;
      const revealedAtCV = properties.data['revealed-at'] as IntCV;
      const addressCV = properties.data['namespace-import'] as StandardPrincipalCV;
      const priceFunction = properties.data['price-function'] as TupleCV;
      const baseCV = priceFunction.data['base'] as IntCV;
      const coeffCV = priceFunction.data['coeff'] as IntCV;
      const noVowelDiscountCV = priceFunction.data['no-vowel-discount'] as IntCV;
      const nonalphaDiscountCV = priceFunction.data['nonalpha-discount'] as IntCV;
      const bucketsCV = priceFunction.data['buckets'] as ListCV;
      const buckets: string[] = [];
      const listCV = bucketsCV.list;
      for (let i = 0; i < listCV.length; i++) {
        const cv = listCV[i] as UIntCV;
        buckets.push(cv.value.toString());
      }
      return {
        namespace: bytesToUtf8(namespaceCV.buffer),
        status: statusCV.data,
        launchedAt: launchAtIntCV.value.toString(),
        lifetime: lifetimeCV.value.toString(),
        revealedAt: revealedAtCV.value.toString(),
        address: addressToString(addressCV.address),
        base: baseCV.value.toString(),
        coeff: coeffCV.value.toString(),
        noVowelDiscount: noVowelDiscountCV.value.toString(),
        nonalphaDiscount: nonalphaDiscountCV.value.toString(),
        buckets,
      };
    }

    // The new way of deserializing with type generics 🙂
    function parseWithTypeDefinition() {
      // (tuple
      //   (namespace (buff 3))
      //   (status (string-ascii 5))
      //   (properties (tuple
      //     (launched-at (optional uint))
      //     (namespace-import principal)
      //     (lifetime uint)
      //     (revealed-at uint)
      //     (price-function (tuple
      //       (base uint)
      //       (coeff uint)
      //       (no-vowel-discount uint)
      //       (nonalpha-discount uint)
      //       (buckets (list 16 uint))
      //
      // Easily map the Clarity type string above to the Typescript definition:
      type BnsNamespaceCV = TupleCV<{
        ['namespace']: BufferCV;
        ['status']: StringAsciiCV;
        ['properties']: TupleCV<{
          ['launched-at']: SomeCV<UIntCV>;
          ['namespace-import']: StandardPrincipalCV;
          ['lifetime']: IntCV;
          ['revealed-at']: IntCV;
          ['price-function']: TupleCV<{
            ['base']: IntCV;
            ['coeff']: IntCV;
            ['no-vowel-discount']: IntCV;
            ['nonalpha-discount']: IntCV;
            ['buckets']: ListCV<UIntCV>;
          }>;
        }>;
      }>;
      const cv = deserializeCV<BnsNamespaceCV>(serializedClarityValue);
      // easy, fully-typed access into the Clarity value properties
      const namespaceProps = cv.data.properties.data;
      const priceProps = namespaceProps['price-function'].data;
      return {
        namespace: bytesToUtf8(cv.data.namespace.buffer),
        status: cv.data.status.data,
        launchedAt: namespaceProps['launched-at'].value.value.toString(),
        lifetime: namespaceProps.lifetime.value.toString(),
        revealedAt: namespaceProps['revealed-at'].value.toString(),
        address: addressToString(namespaceProps['namespace-import'].address),
        base: priceProps.base.value.toString(),
        coeff: priceProps.coeff.value.toString(),
        noVowelDiscount: priceProps['no-vowel-discount'].value.toString(),
        nonalphaDiscount: priceProps['nonalpha-discount'].value.toString(),
        buckets: priceProps.buckets.list.map(b => b.value.toString()),
      };
    }

    const parsed1 = parseWithManualTypeAssertions();
    const parsed2 = parseWithTypeDefinition();
    const expected = {
      namespace: 'foo',
      status: 'ready',
      launchedAt: '6',
      lifetime: '12',
      revealedAt: '3',
      address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      base: '1',
      coeff: '1',
      noVowelDiscount: '1',
      nonalphaDiscount: '1',
      buckets: ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
    };
    expect(parsed1).toEqual(expected);
    expect(parsed2).toEqual(expected);
  });

  describe('Serialize Then Deserialize', () => {
    test('TrueCV', () => {
      const t = trueCV();
      const serializedDeserialized = serializeDeserialize(t);
      expect(serializedDeserialized).toEqual(t);
    });

    test('FalseCV', () => {
      const f = falseCV();
      const serializedDeserialized = serializeDeserialize(f);
      expect(serializedDeserialized).toEqual(f);
    });

    test('NoneCV', () => {
      const n = noneCV();
      const serializedDeserialized = serializeDeserialize(n);
      expect(serializedDeserialized).toEqual(n);
    });

    test('SomeCV', () => {
      const maybeTrue = someCV(trueCV());
      const serializedDeserialized = serializeDeserialize(maybeTrue);
      expect(serializedDeserialized).toEqual(maybeTrue);
    });

    test('BufferCV', () => {
      const buffer = utf8ToBytes('this is a test');
      const buf = bufferCV(buffer);
      const serializedDeserialized = serializeDeserialize(buf);
      expect(serializedDeserialized).toEqual(buf);
    });

    test('IntCV - simple value serialization', () => {
      const intPositiveTen = intCV(10);
      expect(intPositiveTen.value.toString()).toEqual('10');
      expect(cvToString(intPositiveTen)).toEqual('10');
      const serializedDeserializedPositive = serializeDeserialize(intPositiveTen) as IntCV;
      expect(cvToString(serializedDeserializedPositive)).toEqual(cvToString(intPositiveTen));

      const intNegativeTen = intCV(-10);
      expect(intNegativeTen.value.toString()).toEqual('-10');
      const serializedDeserializedNegative = serializeDeserialize(intNegativeTen) as IntCV;
      expect(cvToString(serializedDeserializedNegative)).toEqual(cvToString(intNegativeTen));

      expect(() => {
        // @ts-expect-error ts(2322) Type 'string' is not assignable to type 'number'
        intCV(['example string array']);
      }).toThrowError(TypeError);

      expect(() => intCV(NaN)).toThrowError(RangeError);
      expect(() => intCV(Infinity)).toThrowError(RangeError);
      expect(() => intCV(3.1415)).toThrowError(RangeError);
      expect(() => intCV('3.1415')).toThrowError(RangeError);
    });

    test.each([
      [1, '1', '0x00000000000000000000000000000001'],
      [-1, '-1', '0xffffffffffffffffffffffffffffffff'],
      [-10, '-10', '0xfffffffffffffffffffffffffffffff6'],
      [-10n, '-10', '0xfffffffffffffffffffffffffffffff6'],
      ['-10', '-10', '0xfffffffffffffffffffffffffffffff6'],
      ['0xfff6', '-10', '0xfffffffffffffffffffffffffffffff6'],
      ['0xf6', '-10', '0xfffffffffffffffffffffffffffffff6'],
      [BigInt(-10), '-10', '0xfffffffffffffffffffffffffffffff6'],
      [new Uint8Array([0xff, 0xf6]), '-10', '0xfffffffffffffffffffffffffffffff6'],
      [new Uint8Array([0xf6]), '-10', '0xfffffffffffffffffffffffffffffff6'],
      [new Uint8Array([0xff, 0xfe]), '-2', '0xfffffffffffffffffffffffffffffffe'],
      [new Uint8Array([0xfe]), '-2', '0xfffffffffffffffffffffffffffffffe'],
      [Uint8Array.of(0xff, 0xfe), '-2', '0xfffffffffffffffffffffffffffffffe'],
      [Uint8Array.of(0xfe), '-2', '0xfffffffffffffffffffffffffffffffe'],
      [-200, '-200', '0xffffffffffffffffffffffffffffff38'],
      [new Uint8Array([0xff, 0x38]), '-200', '0xffffffffffffffffffffffffffffff38'],
      [200, '200', '0x000000000000000000000000000000c8'],
      [2e2, '200', '0x000000000000000000000000000000c8'],
      [10, '10', '0x0000000000000000000000000000000a'],
      [10n, '10', '0x0000000000000000000000000000000a'],
      [1e1, '10', '0x0000000000000000000000000000000a'],
      ['10', '10', '0x0000000000000000000000000000000a'],
      ['0x0a', '10', '0x0000000000000000000000000000000a'],
      ['0x000a', '10', '0x0000000000000000000000000000000a'],
      ['0xa', '10', '0x0000000000000000000000000000000a'], // hex string with odd padding
      ['0x00a', '10', '0x0000000000000000000000000000000a'], // hex string with odd padding
      [BigInt(10), '10', '0x0000000000000000000000000000000a'],
      [new Uint8Array([0x0a]), '10', '0x0000000000000000000000000000000a'],
      [new Uint8Array([0x00, 0x0a]), '10', '0x0000000000000000000000000000000a'],
      [Uint8Array.of(0x0a), '10', '0x0000000000000000000000000000000a'],
      [Uint8Array.of(0x00, 0x0a), '10', '0x0000000000000000000000000000000a'],
    ])('IntCV - value %o is serialized to %o', (num, expectedInt, expectedHex) => {
      const numCV = intCV(num);
      expect(numCV.value.toString()).toBe(expectedInt);
      const serialized = serializeCV(numCV);
      expect('0x' + bytesToHex(serialized.slice(1))).toBe(expectedHex);
      expect(cvToString(deserializeCV(serialized))).toBe(expectedInt);
    });

    test('IntCV - bounds', () => {
      // Max 128-bit signed integer
      const maxSigned128 = intCV(2n ** 127n - 1n);
      expect(maxSigned128.value.toString()).toBe('170141183460469231731687303715884105727');
      const serializedMax = serializeCV(maxSigned128);
      expect('0x' + bytesToHex(serializedMax.slice(1))).toBe('0x7fffffffffffffffffffffffffffffff');
      const serializedDeserializedMax = serializeDeserialize(maxSigned128) as IntCV;
      expect(cvToString(serializedDeserializedMax)).toBe(cvToString(maxSigned128));

      // Min 128-bit signed integer
      const minSigned128 = intCV((-2n) ** 127n);
      expect(minSigned128.value.toString()).toBe('-170141183460469231731687303715884105728');
      const serializedMin = serializeCV(minSigned128);
      expect('0x' + bytesToHex(serializedMin.slice(1))).toBe('0x80000000000000000000000000000000');
      const serializedDeserializedMin = serializeDeserialize(minSigned128) as IntCV;
      expect(cvToString(serializedDeserializedMin)).toBe(cvToString(minSigned128));

      // Out of bounds, too large
      expect(() => intCV(2n ** 127n)).toThrow(RangeError);

      // Out of bounds, too small
      expect(() => intCV((-2n) ** 127n - 1n)).toThrow(RangeError);
    });

    test('UIntCV - simple value serialization', () => {
      const uint = uintCV(10);
      expect(uint.value.toString()).toBe('10');
      const serialized1 = serializeCV(uint);
      expect('0x' + bytesToHex(serialized1.slice(1))).toBe('0x0000000000000000000000000000000a');
      const serializedDeserialized = serializeDeserialize(uint) as UIntCV;
      expect(cvToString(serializedDeserialized)).toBe(cvToString(uint));

      const uint2 = uintCV('0x0a');
      const serialized2 = serializeCV(uint2);
      expect('0x' + bytesToHex(serialized2.slice(1))).toBe('0x0000000000000000000000000000000a');
      expect(cvToString(serializeDeserialize(uint2))).toBe(cvToString(uint));
    });

    test('UIntCV - bounds', () => {
      // Max 128-bit integer
      const max128 = uintCV(2n ** 128n - 1n);
      expect(max128.value.toString()).toBe('340282366920938463463374607431768211455');
      const serializedMax = serializeCV(max128);
      expect('0x' + bytesToHex(serializedMax.slice(1))).toBe('0xffffffffffffffffffffffffffffffff');
      const serializedDeserializedMax = serializeDeserialize(max128) as IntCV;
      expect(cvToString(serializedDeserializedMax)).toBe(cvToString(max128));

      // Min 128-bit integer
      const min128 = uintCV(0);
      expect(min128.value.toString()).toBe('0');
      const serializedMin = serializeCV(min128);
      expect('0x' + bytesToHex(serializedMin.slice(1))).toBe('0x00000000000000000000000000000000');
      const serializedDeserializedMin = serializeDeserialize(min128) as IntCV;
      expect(cvToString(serializedDeserializedMin)).toBe(cvToString(min128));

      // Out of bounds, too large
      expect(() => uintCV(2n ** 128n)).toThrow(RangeError);

      // Out of bounds, too small
      expect(() => uintCV(-1)).toThrow(RangeError);
    });

    test.each([
      [200, '200', '0x000000000000000000000000000000c8'],
      [10, '10', '0x0000000000000000000000000000000a'],
      [10n, '10', '0x0000000000000000000000000000000a'],
      ['10', '10', '0x0000000000000000000000000000000a'],
      ['0x0a', '10', '0x0000000000000000000000000000000a'],
      [BigInt(10), '10', '0x0000000000000000000000000000000a'],
      [new Uint8Array([0x0a]), '10', '0x0000000000000000000000000000000a'],
      [new Uint8Array([0x00, 0x0a]), '10', '0x0000000000000000000000000000000a'],
    ])('UIntCV - value %o is serialized to %o', (num, expectedInt, expectedHex) => {
      const numCV = uintCV(num);
      expect(numCV.value.toString()).toBe(expectedInt);
      const serialized = serializeCV(numCV);
      expect('0x' + bytesToHex(serialized.slice(1))).toBe(expectedHex);
      expect(cvToString(deserializeCV(serialized))).toBe('u' + expectedInt);
    });

    test('Clarity integer to JSON value', () => {
      // 53 bits is max safe integer and max supported by bn.js `toNumber()`

      const maxSafeInt = 2n ** 53n - 1n;
      const unsafeLargeIntSize = maxSafeInt + 1n;
      expect(maxSafeInt.toString()).toBe(Number.MAX_SAFE_INTEGER.toString());

      const minSafeInt = -(2n ** 53n - 1n);
      const unsafeMinIntSize = minSafeInt - 1n;
      expect(minSafeInt.toString()).toBe(Number.MIN_SAFE_INTEGER.toString());

      const smallBitsUInt1 = cvToValue(uintCV(maxSafeInt), true);
      expect(smallBitsUInt1.toString()).toBe(maxSafeInt.toString());
      expect(typeof smallBitsUInt1).toBe('string');

      const smallBitsInt1 = cvToValue(intCV(maxSafeInt), true);
      expect(smallBitsInt1.toString()).toBe(maxSafeInt.toString());
      expect(typeof smallBitsInt1).toBe('string');

      const smallBitsInt2 = cvToValue(intCV(minSafeInt), true);
      expect(smallBitsInt2.toString()).toBe(minSafeInt.toString());
      expect(typeof smallBitsInt2).toBe('string');

      const largeBitsUInt1 = cvToValue(uintCV(unsafeLargeIntSize), true);
      expect(largeBitsUInt1.toString()).toBe(unsafeLargeIntSize.toString());
      expect(typeof largeBitsUInt1).toBe('string');

      const largeBitsInt1 = cvToValue(intCV(unsafeLargeIntSize), true);
      expect(largeBitsInt1.toString()).toBe(unsafeLargeIntSize.toString());
      expect(typeof largeBitsInt1).toBe('string');

      const largeBitsInt2 = cvToValue(intCV(unsafeMinIntSize), true);
      expect(largeBitsInt2.toString()).toBe(unsafeMinIntSize.toString());
      expect(typeof largeBitsInt2).toBe('string');
    });

    test('Standard Principal', () => {
      const standardPrincipal = standardPrincipalCV(ADDRESS);
      const serializedDeserialized = serializeDeserialize(standardPrincipal);
      expect(serializedDeserialized).toEqual(standardPrincipal);
    });

    test('Contract Principal', () => {
      const contractPrincipal = contractPrincipalCV(ADDRESS, 'test-contract');
      const serializedDeserialized = serializeDeserialize(contractPrincipal);
      expect(serializedDeserialized).toEqual(contractPrincipal);
    });

    test('Response Ok', () => {
      const responseOk = responseOkCV(trueCV());
      const serializedDeserialized = serializeDeserialize(responseOk);
      expect(serializedDeserialized).toEqual(responseOk);
    });

    test('Response Error', () => {
      const responseErr = responseErrorCV(trueCV());
      const serializedDeserialized = serializeDeserialize(responseErr);
      expect(serializedDeserialized).toEqual(responseErr);
    });

    test('ListCV', () => {
      const list = listCV([trueCV(), falseCV(), trueCV()]);
      const serializedDeserialized = serializeDeserialize(list);
      expect(serializedDeserialized).toEqual(list);
    });

    test('TupleCV', () => {
      const tuple = tupleCV({
        c: trueCV(),
        b: falseCV(),
        a: trueCV(),
      });
      const serializedDeserialized = serializeDeserialize(tuple) as TupleCV;
      expect(serializedDeserialized).toEqual(tuple);

      // Test lexicographic ordering of tuple keys (to match Node Buffer compare)
      const lexicographic = Object.keys(tuple.data).sort((a, b) => {
        // eslint-disable-next-line node/prefer-global/buffer
        const bufA = Buffer.from(a);
        // eslint-disable-next-line node/prefer-global/buffer
        const bufB = Buffer.from(b);
        return bufA.compare(bufB);
      });
      expect(Object.keys(serializedDeserialized.data)).toEqual(lexicographic);
    });

    test('StringAsciiCV', () => {
      const str = stringAsciiCV('hello world');
      const serializedDeserialized = serializeDeserialize(str) as StringAsciiCV;
      expect(serializedDeserialized).toEqual(str);
    });

    test('StringUtf8CV', () => {
      const str = stringUtf8CV('hello 🌾');
      const serializedDeserialized = serializeDeserialize(str) as StringUtf8CV;
      expect(serializedDeserialized).toEqual(str);
    });
  });

  describe('Serialization Test Vectors', () => {
    test('Int 1 Vector', () => {
      const int = intCV(1);
      const serialized = bytesToHex(serializeCV(int));
      expect(serialized).toEqual('0000000000000000000000000000000001');
    });

    test('Int -1 Vector', () => {
      const int = intCV(-1);
      const serialized = bytesToHex(serializeCV(int));
      expect(serialized).toEqual('00ffffffffffffffffffffffffffffffff');
    });

    test('UInt 1 Vector', () => {
      const uint = uintCV(1);
      const serialized = bytesToHex(serializeCV(uint));
      expect(serialized).toEqual('0100000000000000000000000000000001');
    });

    test('Buffer Vector', () => {
      const buffer = bufferCV(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
      const serialized = bytesToHex(serializeCV(buffer));
      expect(serialized).toEqual('0200000004deadbeef');
    });

    test('True Vector', () => {
      const t = trueCV();
      const serialized = bytesToHex(serializeCV(t));
      expect(serialized).toEqual('03');
    });

    test('False Vector', () => {
      const f = falseCV();
      const serialized = bytesToHex(serializeCV(f));
      expect(serialized).toEqual('04');
    });

    test('Standard Principal Vector', () => {
      const addressBuffer = new Uint8Array([
        0x11, 0xde, 0xad, 0xbe, 0xef, 0x11, 0xab, 0xab, 0xff, 0xff, 0x11, 0xde, 0xad, 0xbe, 0xef,
        0x11, 0xab, 0xab, 0xff, 0xff,
      ]);
      const bufferReader = new ByteReader(concatBytes(new Uint8Array([0x00]), addressBuffer));
      const standardPrincipal = standardPrincipalCVFromAddress(deserializeAddress(bufferReader));
      const serialized = bytesToHex(serializeCV(standardPrincipal));
      expect(serialized).toEqual('050011deadbeef11ababffff11deadbeef11ababffff');
    });

    test('Contract Principal Vector', () => {
      const addressBuffer = new Uint8Array([
        0x11, 0xde, 0xad, 0xbe, 0xef, 0x11, 0xab, 0xab, 0xff, 0xff, 0x11, 0xde, 0xad, 0xbe, 0xef,
        0x11, 0xab, 0xab, 0xff, 0xff,
      ]);
      const contractName = 'abcd';
      const bufferReader = new ByteReader(concatBytes(new Uint8Array([0x00]), addressBuffer));
      const standardPrincipal = standardPrincipalCVFromAddress(deserializeAddress(bufferReader));
      const contractPrincipal = contractPrincipalCVFromStandard(standardPrincipal, contractName);
      const serialized = bytesToHex(serializeCV(contractPrincipal));
      expect(serialized).toEqual('060011deadbeef11ababffff11deadbeef11ababffff0461626364');
    });

    test('Response Ok Vector', () => {
      const ok = responseOkCV(intCV(-1));
      const serialized = bytesToHex(serializeCV(ok));
      expect(serialized).toEqual('0700ffffffffffffffffffffffffffffffff');
    });

    test('Response Err Vector', () => {
      const err = responseErrorCV(intCV(-1));
      const serialized = bytesToHex(serializeCV(err));
      expect(serialized).toEqual('0800ffffffffffffffffffffffffffffffff');
    });

    test('None Vector', () => {
      const none = noneCV();
      const serialized = bytesToHex(serializeCV(none));
      expect(serialized).toEqual('09');
    });

    test('Some Vector', () => {
      const some = someCV(intCV(-1));
      const serialized = bytesToHex(serializeCV(some));
      expect(serialized).toEqual('0a00ffffffffffffffffffffffffffffffff');
    });

    test('List Vector', () => {
      const list = listCV([intCV(1), intCV(2), intCV(3), intCV(-4)]);
      const serialized = bytesToHex(serializeCV(list));
      expect(serialized).toEqual(
        '0b0000000400000000000000000000000000000000010000000000000000000000000000000002000000000000000000000000000000000300fffffffffffffffffffffffffffffffc'
      );
    });

    test('Tuple Vector', () => {
      const tuple = tupleCV({
        baz: noneCV(),
        foobar: trueCV(),
      });
      const serialized = bytesToHex(serializeCV(tuple));
      expect(serialized).toEqual('0c000000020362617a0906666f6f62617203');
    });

    test('Ascii String Vector', () => {
      const str = stringAsciiCV('hello world');
      const serialized = bytesToHex(serializeCV(str));
      expect(serialized).toEqual('0d0000000b68656c6c6f20776f726c64');
    });

    test('Ascii String Escaped Length', () => {
      const strings = [
        stringAsciiCV('\\'),
        stringAsciiCV('"'),
        stringAsciiCV('\n'),
        stringAsciiCV('\t'),
        stringAsciiCV('\r'),
        stringAsciiCV('\0'),
      ];
      const serialized = strings.map(serializeCV);
      serialized.forEach(ser => {
        const reader = new ByteReader(ser);
        const serializedStringLenByte = reader.readBytes(5)[4];
        expect(serializedStringLenByte).toEqual(1);
        expect(ser.length).toEqual(6);
      });
    });

    test('Utf8 String Vector', () => {
      const str = stringUtf8CV('hello world');
      const serialized = bytesToHex(serializeCV(str));
      expect(serialized).toEqual('0e0000000b68656c6c6f20776f726c64');
    });
  });

  describe('Clarity Value To Clarity String Literal', () => {
    test('Complex Tuple', () => {
      const tuple = tupleCV({
        a: intCV(-1),
        b: uintCV(1),
        c: bufferCV(utf8ToBytes('test')),
        d: trueCV(),
        e: someCV(trueCV()),
        f: noneCV(),
        g: standardPrincipalCV(ADDRESS),
        h: contractPrincipalCV(ADDRESS, 'test'),
        i: responseOkCV(trueCV()),
        j: responseErrorCV(falseCV()),
        k: listCV([trueCV(), falseCV()]),
        l: tupleCV({
          a: trueCV(),
          b: falseCV(),
        }),
        m: stringAsciiCV('hello world'),
        n: stringUtf8CV('hello \u{1234}'),
      });

      const tupleString = cvToString(tuple);

      expect(tupleString).toEqual(
        `(tuple (a -1) (b u1) (c 0x74657374) (d true) (e (some true)) (f none) (g SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B) (h SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B.test) (i (ok true)) (j (err false)) (k (list true false)) (l (tuple (a true) (b false))) (m "hello world") (n u"hello \u{1234}"))`
      );
    });

    test('Hex Buffers', () => {
      expect(cvToString(bufferCV(asciiToBytes('\n')))).toEqual('0x0a');
      expect(cvToString(bufferCV(hexToBytes('00')))).toEqual('0x00');
      expect(cvToString(bufferCV(new Uint8Array([127])))).toEqual('0x7f');
    });
  });

  describe('Clarity value to JSON', () => {
    test('Complex Tuple', () => {
      const tuple = tupleCV({
        a: intCV(-1),
        b: uintCV(1),
        c: bufferCV(utf8ToBytes('test')),
        d: trueCV(),
        e: someCV(trueCV()),
        f: noneCV(),
        g: standardPrincipalCV(ADDRESS),
        h: contractPrincipalCV(ADDRESS, 'test'),
        i: responseOkCV(trueCV()),
        j: responseErrorCV(falseCV()),
        k: listCV([trueCV(), falseCV()]),
        l: tupleCV({
          a: trueCV(),
          b: falseCV(),
        }),
        m: stringAsciiCV('hello world'),
        n: stringUtf8CV('hello \u{1234}'),
      });

      const tupleString = JSON.stringify(cvToJSON(tuple));

      expect(tupleString).toEqual(
        `{"type":"(tuple (a int) (b uint) (c (buff 4)) (d bool) (e (optional bool)) (f (optional none)) (g principal) (h principal) (i (response bool UnknownType)) (j (response UnknownType bool)) (k (list 2 bool)) (l (tuple (a bool) (b bool))) (m (string-ascii 11)) (n (string-utf8 9)))","value":{"a":{"type":"int","value":"-1"},"b":{"type":"uint","value":"1"},"c":{"type":"(buff 4)","value":"0x74657374"},"d":{"type":"bool","value":true},"e":{"type":"(optional bool)","value":{"type":"bool","value":true}},"f":{"type":"(optional none)","value":null},"g":{"type":"principal","value":"SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B"},"h":{"type":"principal","value":"SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B.test"},"i":{"type":"(response bool UnknownType)","value":{"type":"bool","value":true},"success":true},"j":{"type":"(response UnknownType bool)","value":{"type":"bool","value":false},"success":false},"k":{"type":"(list 2 bool)","value":[{"type":"bool","value":true},{"type":"bool","value":false}]},"l":{"type":"(tuple (a bool) (b bool))","value":{"a":{"type":"bool","value":true},"b":{"type":"bool","value":false}}},"m":{"type":"(string-ascii 11)","value":"hello world"},"n":{"type":"(string-utf8 9)","value":"hello \u{1234}"}}}`
      );
    });

    test('Hex Buffer', () => {
      expect(JSON.stringify(cvToJSON(bufferCV(asciiToBytes('\n'))))).toEqual(
        `{"type":"(buff 1)","value":"0x0a"}`
      );
    });
  });

  describe('Clarity Types to String', () => {
    test('Complex Tuple', () => {
      const tuple = tupleCV({
        a: intCV(-1),
        b: uintCV(1),
        c: bufferCV(utf8ToBytes('test')),
        d: trueCV(),
        e: someCV(trueCV()),
        f: noneCV(),
        g: standardPrincipalCV(ADDRESS),
        h: contractPrincipalCV(ADDRESS, 'test'),
        i: responseOkCV(trueCV()),
        j: responseErrorCV(falseCV()),
        k: listCV([trueCV(), falseCV()]),
        l: tupleCV({
          a: trueCV(),
          b: falseCV(),
        }),
        m: stringAsciiCV('hello world'),
        n: stringUtf8CV('hello \u{1234}'),
        o: listCV([]),
      });
      const typeString = getCVTypeString(tuple);
      expect(typeString).toEqual(
        '(tuple (a int) (b uint) (c (buff 4)) (d bool) (e (optional bool)) (f (optional none)) (g principal) (h principal) (i (response bool UnknownType)) (j (response UnknownType bool)) (k (list 2 bool)) (l (tuple (a bool) (b bool))) (m (string-ascii 11)) (n (string-utf8 9)) (o (list 0 UnknownType)))'
      );
    });
  });
});
