import { sha256 } from '@noble/hashes/sha256';
import { standardPrincipalCV, stringAsciiCV, trueCV, tupleCV, uintCV } from '../src/clarity';
import { createStacksPrivateKey } from '../src/keys';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import {
  decodeStructuredDataSignature,
  encodeStructuredData,
  hashStructuredData,
  signStructuredData,
  STRUCTURED_DATA_PREFIX,
} from '../src/structuredDataSignature';

const chainIds = {
  mainnet: 1,
  testnet: 2147483648,
};

const principal1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';

test('prefix buffer', () => {
  // Refer to SIP018 https://github.com/stacksgov/sips/
  // "\x53\x49\x50\x30\x31\x38" is "SIP018" in ASCII
  expect(
    Buffer.from([0x53, 0x49, 0x50, 0x30, 0x31, 0x38]).equals(STRUCTURED_DATA_PREFIX)
  ).toBeTruthy();
});

describe('encodeStructuredData / decodeStructuredDataSignature', () => {
  const inputs = [
    {
      message: tupleCV({
        amount: uintCV('100'),
        recipient: standardPrincipalCV(principal1),
        salt: uintCV('12345'),
      }),
      domain: tupleCV({
        name: stringAsciiCV('hiro.so'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    },
    {
      message: trueCV(),
      domain: tupleCV({
        name: stringAsciiCV('hiro.so'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    },
  ];
  test.each(inputs)('encoding / decoding', ({ message, domain }) => {
    // encode message and domain
    const domainHash = hashStructuredData(domain);
    const messageHash = hashStructuredData(message);
    const encoded = encodeStructuredData({ message, domain });
    const { domainHash: decodedDomainHash, messageHash: decodedMessageHash } =
      decodeStructuredDataSignature(encoded);
    expect(decodedDomainHash).toEqual(domainHash);
    expect(decodedMessageHash).toEqual(messageHash);
  });

  test('encoding non ClarityValue domain', () => {
    const input = {
      message: tupleCV({
        amount: uintCV('100'),
        recipient: standardPrincipalCV(principal1),
        salt: uintCV('12345'),
      }),
      domain: 'string example' as any, // Cast the type to trigger the error
    };
    expect(() => hashStructuredData(input.domain)).toThrowError();
    expect(() => hashStructuredData(input.message)).not.toThrowError();
    expect(() => encodeStructuredData(input)).toThrowError();
  });

  const validMessage = tupleCV({
    amount: uintCV('100'),
    recipient: standardPrincipalCV(principal1),
    salt: uintCV('12345'),
  });
  const badDomainInputs = [
    // Missing keys
    {
      message: validMessage,
      domain: tupleCV({
        name: stringAsciiCV('hiro.so'),
        version: stringAsciiCV('1.0.0'),
        // 'chain-id': uintCV(chainIds['mainnet']), // Remove the key to trigger an error
      }),
    },
    // Incorrect 'name' type
    {
      message: validMessage,
      domain: tupleCV({
        name: uintCV(1),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    },
    // Incorrect 'version' type
    {
      message: validMessage,
      domain: tupleCV({
        name: stringAsciiCV('myapp'),
        version: uintCV(1),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    },
    // Incorrect 'chain-id' type
    {
      message: validMessage,
      domain: tupleCV({
        name: stringAsciiCV('myapp'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': stringAsciiCV('1'),
      }),
    },
  ];

  test.each(badDomainInputs)('encoding / decoding failures bad domain type', input => {
    expect(() => hashStructuredData(input.domain)).not.toThrowError();
    expect(() => hashStructuredData(input.message)).not.toThrowError();
    expect(() => encodeStructuredData(input)).toThrowError();
  });

  test('encoding / decoding failures bad message type', () => {
    const message1 = 'another string message' as any; // Cast the type to trigger the error
    const domain1 = tupleCV({
      name: stringAsciiCV('hiro.so'),
      version: stringAsciiCV('1.0.0'),
      'chain-id': uintCV(chainIds['mainnet']),
    });

    expect(() => hashStructuredData(domain1)).not.toThrowError();
    expect(() => hashStructuredData(message1)).toThrowError(); // Cast the type to throw error
    expect(() => encodeStructuredData({ message: message1, domain: domain1 })).toThrowError();
  });

  test('encoding different inputs produces different outputs', () => {
    const input1 = {
      message: tupleCV({
        amount: uintCV('100'),
        recipient: standardPrincipalCV(principal1),
        salt: uintCV('12345'),
      }),
      domain: tupleCV({
        name: stringAsciiCV('docs.stacks.co'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    };

    const input2 = {
      message: tupleCV({
        amount: uintCV('100'),
        recipient: standardPrincipalCV(principal1),
        salt: uintCV('12345'),
      }),
      domain: tupleCV({
        name: stringAsciiCV('hiro.so'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(chainIds['mainnet']),
      }),
    };

    const input1Encoded = encodeStructuredData(input1);
    const input2Encoded = encodeStructuredData(input2);
    expect(input1Encoded).not.toEqual(input2Encoded);
  });
});

// See https://github.com/MarvinJanssen/sips/blob/feat/signed-structured-data/sips/sip-018/sip-018-signed-structured-data.md#test-vectors
describe('SIP018 test vectors', () => {
  const inputs = [
    {
      input: stringAsciiCV('Hello World'),
      expected: '5297eef9765c466d945ad1cb2c81b30b9fed6c165575dc9226e9edf78b8cd9e8',
    },
    {
      input: stringAsciiCV(''),
      expected: '3c8f1b104592e3ebb2b2602b3979a27e77f586fb4c655369fa4eccb6d545a0f8',
    },
    {
      input: tupleCV({
        name: stringAsciiCV('Test App'),
        version: stringAsciiCV('1.0.0'),
        'chain-id': uintCV(1),
      }),
      expected: '2538b5dc06c5ae2f11549261d7ae174d9f77a55a92b00f330884695497be5065',
    },
  ];

  test.each(inputs)('Structured data hashing', ({ input, expected }) => {
    expect(hashStructuredData(input).toString('hex')).toEqual(expected);
  });

  test('Message hashing', () => {
    // Using messageHash(CV), which is sha256(Prefix || structuredDataHash(Domain) || structuredDataHash(CV)).
    const prefix = '534950303138';
    expect(prefix).toEqual(STRUCTURED_DATA_PREFIX.toString('hex'));
    const domain = tupleCV({
      name: stringAsciiCV('Test App'),
      version: stringAsciiCV('1.0.0'),
      'chain-id': uintCV(1),
    });

    const message = stringAsciiCV('Hello World');
    const expectedMessageHash = '1bfdab6d4158313ce34073fbb8d6b0fc32c154d439def12247a0f44bb2225259';
    expect(Buffer.from(sha256(encodeStructuredData({ message, domain }))).toString('hex')).toEqual(
      expectedMessageHash
    );
  });

  test('Message signing', () => {
    const privateKeyString = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';
    const publicKey = '0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa';
    // const address = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const domain = tupleCV({
      name: stringAsciiCV('Test App'),
      version: stringAsciiCV('1.0.0'),
      'chain-id': uintCV(1),
    });
    const message = stringAsciiCV('Hello World');
    const messageHash = '1bfdab6d4158313ce34073fbb8d6b0fc32c154d439def12247a0f44bb2225259';
    const expectedSignature =
      '8b94e45701d857c9f1d1d70e8b2ca076045dae4920fb0160be0642a68cd78de072ab527b5c5277a593baeb2a8b657c216b99f7abb5d14af35b4bf12ba6460ba401';
    const privateKey = createStacksPrivateKey(privateKeyString);
    const computedSignature = signStructuredData({
      message,
      domain,
      privateKey,
    });
    expect(computedSignature.data).toEqual(expectedSignature);
    // Verify signature
    const isSignatureVerified = verifyMessageSignatureRsv({
      signature: computedSignature.data,
      message: Buffer.from(messageHash, 'hex'),
      publicKey,
    });
    expect(isSignatureVerified).toBe(true);
  });
});
