import { oneLineTrim } from 'common-tags';
import { deserializeAddress } from '../src/types';
import {
  ClarityValue,
  serializeCV,
  deserializeCV,
  trueCV,
  falseCV,
  noneCV,
  someCV,
  bufferCV,
  IntCV,
  intCV,
  uintCV,
  UIntCV,
  standardPrincipalCV,
  contractPrincipalCV,
  responseOkCV,
  responseErrorCV,
  listCV,
  tupleCV,
  TupleCV,
  standardPrincipalCVFromAddress,
  contractPrincipalCVFromStandard,
  stringAsciiCV,
  StringAsciiCV,
  stringUtf8CV,
  StringUtf8CV,
} from '../src/clarity';
import { BufferReader } from '../src/bufferReader';
import { cvToString, cvToJSON } from '../src/clarity/clarityValue';

const ADDRESS = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';

function serializeDeserialize<T extends ClarityValue>(value: T): ClarityValue {
  const serializedDeserialized: Buffer = serializeCV(value);
  const bufferReader = new BufferReader(serializedDeserialized);
  return deserializeCV(bufferReader);
}

describe('Clarity Types', () => {
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
      const buffer = Buffer.from('this is a test');
      const buf = bufferCV(buffer);
      const serializedDeserialized = serializeDeserialize(buf);
      expect(serializedDeserialized).toEqual(buf);
    });

    test('IntCV', () => {
      const int = intCV(10);
      const serializedDeserialized = serializeDeserialize(int) as IntCV;
      expect(cvToString(serializedDeserialized)).toEqual(cvToString(int));
    });

    test('UIntCV', () => {
      const uint = uintCV(10);
      const serializedDeserialized = serializeDeserialize(uint) as UIntCV;
      expect(cvToString(serializedDeserialized)).toEqual(cvToString(uint));
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

      // Test lexicographic ordering of tuple keys
      const lexicographic = Object.keys(tuple.data).sort((a, b) => {
        const bufA = Buffer.from(a);
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
      const serialized = serializeCV(int).toString('hex');
      expect(serialized).toEqual('0000000000000000000000000000000001');
    });

    test('Int -1 Vector', () => {
      const int = intCV(-1);
      const serialized = serializeCV(int).toString('hex');
      expect(serialized).toEqual('00ffffffffffffffffffffffffffffffff');
    });

    test('UInt 1 Vector', () => {
      const uint = uintCV(1);
      const serialized = serializeCV(uint).toString('hex');
      expect(serialized).toEqual('0100000000000000000000000000000001');
    });

    test('Buffer Vector', () => {
      const buffer = bufferCV(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
      const serialized = serializeCV(buffer).toString('hex');
      expect(serialized).toEqual('0200000004deadbeef');
    });

    test('True Vector', () => {
      const t = trueCV();
      const serialized = serializeCV(t).toString('hex');
      expect(serialized).toEqual('03');
    });

    test('False Vector', () => {
      const f = falseCV();
      const serialized = serializeCV(f).toString('hex');
      expect(serialized).toEqual('04');
    });

    test('Standard Principal Vector', () => {
      const addressBuffer = Buffer.from([
        0x11,
        0xde,
        0xad,
        0xbe,
        0xef,
        0x11,
        0xab,
        0xab,
        0xff,
        0xff,
        0x11,
        0xde,
        0xad,
        0xbe,
        0xef,
        0x11,
        0xab,
        0xab,
        0xff,
        0xff,
      ]);
      const bufferReader = new BufferReader(Buffer.concat([Buffer.from([0x00]), addressBuffer]));
      const standardPrincipal = standardPrincipalCVFromAddress(deserializeAddress(bufferReader));
      const serialized = serializeCV(standardPrincipal).toString('hex');
      expect(serialized).toEqual('050011deadbeef11ababffff11deadbeef11ababffff');
    });

    test('Contract Principal Vector', () => {
      const addressBuffer = Buffer.from([
        0x11,
        0xde,
        0xad,
        0xbe,
        0xef,
        0x11,
        0xab,
        0xab,
        0xff,
        0xff,
        0x11,
        0xde,
        0xad,
        0xbe,
        0xef,
        0x11,
        0xab,
        0xab,
        0xff,
        0xff,
      ]);
      const contractName = 'abcd';
      const bufferReader = new BufferReader(Buffer.concat([Buffer.from([0x00]), addressBuffer]));
      const standardPrincipal = standardPrincipalCVFromAddress(deserializeAddress(bufferReader));
      const contractPrincipal = contractPrincipalCVFromStandard(standardPrincipal, contractName);
      const serialized = serializeCV(contractPrincipal).toString('hex');
      expect(serialized).toEqual('060011deadbeef11ababffff11deadbeef11ababffff0461626364');
    });

    test('Response Ok Vector', () => {
      const ok = responseOkCV(intCV(-1));
      const serialized = serializeCV(ok).toString('hex');
      expect(serialized).toEqual('0700ffffffffffffffffffffffffffffffff');
    });

    test('Response Err Vector', () => {
      const err = responseErrorCV(intCV(-1));
      const serialized = serializeCV(err).toString('hex');
      expect(serialized).toEqual('0800ffffffffffffffffffffffffffffffff');
    });

    test('None Vector', () => {
      const none = noneCV();
      const serialized = serializeCV(none).toString('hex');
      expect(serialized).toEqual('09');
    });

    test('Some Vector', () => {
      const some = someCV(intCV(-1));
      const serialized = serializeCV(some).toString('hex');
      expect(serialized).toEqual('0a00ffffffffffffffffffffffffffffffff');
    });

    test('List Vector', () => {
      const list = listCV([intCV(1), intCV(2), intCV(3), intCV(-4)]);
      const serialized = serializeCV(list).toString('hex');
      expect(serialized).toEqual(
        '0b0000000400000000000000000000000000000000010000000000000000000000000000000002000000000000000000000000000000000300fffffffffffffffffffffffffffffffc'
      );
    });

    test('Tuple Vector', () => {
      const tuple = tupleCV({
        baz: noneCV(),
        foobar: trueCV(),
      });
      const serialized = serializeCV(tuple).toString('hex');
      expect(serialized).toEqual('0c000000020362617a0906666f6f62617203');
    });

    test('Ascii String Vector', () => {
      const str = stringAsciiCV('hello world');
      const serialized = serializeCV(str).toString('hex');
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
        const reader = new BufferReader(ser);
        const serializedStringLenByte = reader.readBuffer(5)[4];
        expect(serializedStringLenByte).toEqual(1);
        expect(ser.length).toEqual(6);
      });
    });

    test('Utf8 String Vector', () => {
      const str = stringUtf8CV('hello world');
      const serialized = serializeCV(str).toString('hex');
      expect(serialized).toEqual('0e0000000b68656c6c6f20776f726c64');
    });
  });

  describe('Clarity Value To Clarity String Literal', () => {
    test('Complex Tuple', () => {
      const tuple = tupleCV({
        a: intCV(-1),
        b: uintCV(1),
        c: bufferCV(Buffer.from('test')),
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
        oneLineTrim`
        (tuple 
          (a -1) 
          (b u1) 
          (c 0x74657374) 
          (d true) 
          (e (some true)) 
          (f none) 
          (g SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B) 
          (h SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B.test) 
          (i (ok true)) 
          (j (err false)) 
          (k (list true false)) 
          (l (tuple (a true) (b false))) 
          (m "hello world") 
          (n u"hello \u{1234}"))`
      );
    });

    test('Hex Buffers', () => {
      expect(cvToString(bufferCV(Buffer.from('\n', 'ascii')))).toEqual('0x0a');
      expect(cvToString(bufferCV(Buffer.from('00', 'hex')))).toEqual('0x00');
      expect(cvToString(bufferCV(Buffer.from([127])))).toEqual('0x7f');
    });
  });

  describe('Clarity value to JSON', () => {
    test('Complex Tuple', () => {
      const tuple = tupleCV({
        a: intCV(-1),
        b: uintCV(1),
        c: bufferCV(Buffer.from('test')),
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
        oneLineTrim`
          {"type":"(tuple (a int) (b uint) (c (buff 4)) (d bool) (e (optional bool)) 
            (f (optional none)) (g principal) (h principal) (i (response bool UnknownType)) 
            (j (response UnknownType bool)) (k (list 2 bool)) (l (tuple (a bool) (b bool))) 
            (m (string-ascii 11)) (n (string-utf8 9)))",
            "value":{
              "a":{"type":"int","value":-1},
              "b":{"type":"uint","value":1},
              "c":{"type":"(buff 4)","value":"0x74657374"},
              "d":{"type":"bool","value":true},
              "e":{"type":"(optional bool)","value":{"type":"bool","value":true}},
              "f":{"type":"(optional none)","value":null},
              "g":{"type":"principal","value":"SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B"},
              "h":{"type":"principal","value":"SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B.test"},
              "i":{"type":"(response bool UnknownType)","value":{"type":"bool","value":true},"success":true},
              "j":{"type":"(response UnknownType bool)","value":{"type":"bool","value":false},"success":false},
              "k":{"type":"(list 2 bool)","value":[{"type":"bool","value":true},{"type":"bool","value":false}]},
              "l":{"type":"(tuple (a bool) (b bool))",
                "value":{"a":{"type":"bool","value":true},"b":{"type":"bool","value":false}}},
              "m":{"type":"(string-ascii 11)","value":"hello world"},
              "n":{"type":"(string-utf8 9)","value":"hello \u{1234}"}}
            }`
      );
    });

    test('Hex Buffer', () => {
      expect(JSON.stringify(cvToJSON(bufferCV(Buffer.from('\n', 'ascii'))))).toEqual(
        oneLineTrim`
        {"type":"(buff 1)",
        "value":"0x0a"}
        `
      );
    });
  });
});
