import { readFileSync } from 'fs';
import { createContractCallPayload } from '../src/payload';

import {
  trueCV,
  intCV,
  tupleCV,
  uintCV,
  standardPrincipalCV,
  contractPrincipalCV,
  bufferCVFromString,
  someCV,
  falseCV,
  listCV,
  responseOkCV,
  responseErrorCV,
  noneCV,
  stringAsciiCV,
  stringUtf8CV,
} from '../src/clarity';

import {
  validateContractCall,
  ClarityAbi,
  abiFunctionToString,
  parseToCV,
  ClarityAbiType,
} from '../src/contract-abi';

import { oneLineTrim } from 'common-tags';

const TEST_ABI: ClarityAbi = JSON.parse(readFileSync('./tests/abi/test-abi.json').toString());

test('ABI validation', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'test';
  const functionName = 'tuple-test';
  const functionArgs = [
    tupleCV({
      key1: trueCV(),
      key2: intCV(-1),
      key3: uintCV(1),
      key4: standardPrincipalCV('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B'),
      key5: bufferCVFromString('foo'),
      key6: someCV(falseCV()),
      key7: responseOkCV(trueCV()),
      key8: listCV([trueCV(), falseCV()]),
      key9: stringAsciiCV('Hello World'),
      key10: stringUtf8CV('Hello World'),
    }),
  ];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  validateContractCall(payload, TEST_ABI);
});

test('ABI validation buffer', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'test';
  const functionName = 'buffer-test';

  const payloadCorrectBuffer = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    [bufferCVFromString('test')]
  );

  validateContractCall(payloadCorrectBuffer, TEST_ABI);

  const payloadBufferTooBig = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    [bufferCVFromString('too large')]
  );

  expect(() => validateContractCall(payloadBufferTooBig, TEST_ABI)).toThrow(
    'Clarity function `buffer-test` expects argument 1 to be of type (buff 6), not (buff 9)'
  );
});

test('ABI validation trait reference', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'test';
  const functionName = 'trait-test';

  const payloadCorrectTrait = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    [contractPrincipalCV('ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE', 'test')]
  );

  validateContractCall(payloadCorrectTrait, TEST_ABI);

  const payloadWrongTrait = createContractCallPayload(contractAddress, contractName, functionName, [
    standardPrincipalCV('ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE'),
  ]);

  expect(() => validateContractCall(payloadWrongTrait, TEST_ABI)).toThrow(
    'Clarity function `trait-test` expects argument 1 to be of type trait_reference, not principal'
  );
});

test('ABI validation fail, tuple mistyped', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'test';
  const functionName = 'tuple-test';
  const functionArgs = [
    tupleCV({
      key1: trueCV(),
      key2: intCV(-1),
      key3: uintCV(1),
      key4: standardPrincipalCV('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B'),
      key5: bufferCVFromString('foo'),
      key6: noneCV(),
      key7: responseErrorCV(trueCV()),
      key8: falseCV(),
      key9: stringAsciiCV('Hello World'),
      key10: stringUtf8CV('Hello World'),
    }),
  ];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  expect(() => validateContractCall(payload, TEST_ABI)).toThrow(
    // Don't forget to include spaces at the end of each line of this multiline string
    oneLineTrim`
    Clarity function \`tuple-test\` expects argument 1 to be of type 
      (tuple 
        (key1 bool) 
        (key2 int) 
        (key3 uint) 
        (key4 principal) 
        (key5 (buff 3)) 
        (key6 (optional bool)) 
        (key7 (response bool bool)) 
        (key8 (list 2 bool)) 
        (key9 (string-ascii 11)) 
        (key10 (string-utf8 11))), not 
      (tuple 
        (key1 bool) 
        (key2 int) 
        (key3 uint) 
        (key4 principal) 
        (key5 (buff 3)) 
        (key6 (optional none)) 
        (key7 (response UnknownType bool)) 
        (key8 bool) 
        (key9 (string-ascii 11)) 
        (key10 (string-utf8 11)))`
  );
});

test('ABI validation fail, tuple wrong key', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'kv-store';
  const functionName = 'tuple-test';
  const functionArgs = [
    tupleCV({
      'wrong-key': trueCV(),
      key2: intCV(-1),
      key3: uintCV(1),
      key4: standardPrincipalCV('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B'),
      key5: bufferCVFromString('foo'),
      key6: someCV(falseCV()),
      key7: responseOkCV(trueCV()),
      key9: listCV([trueCV(), falseCV()]),
    }),
  ];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  expect(() => validateContractCall(payload, TEST_ABI)).toThrow(
    // Don't forget to include spaces at the end of each line of this multiline string
    oneLineTrim`
    Clarity function \`tuple-test\` expects argument 1 to be of type 
    (tuple 
      (key1 bool) 
      (key2 int) 
      (key3 uint) 
      (key4 principal) 
      (key5 (buff 3)) 
      (key6 (optional bool)) 
      (key7 (response bool bool)) 
      (key8 (list 2 bool)) 
      (key9 (string-ascii 11)) 
      (key10 (string-utf8 11))), not 
    (tuple 
      (wrong-key bool) 
      (key2 int) 
      (key3 uint) 
      (key4 principal) 
      (key5 (buff 3)) 
      (key6 (optional bool)) 
      (key7 (response bool UnknownType)) 
      (key9 (list 2 bool)))
    `
  );
});

test('ABI validation fail, wrong number of args', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'kv-store';
  const functionName = 'tuple-test';
  const functionArgs = [trueCV(), falseCV()];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  expect(() => validateContractCall(payload, TEST_ABI)).toThrow(
    'Clarity function expects 1 argument(s) but received 2'
  );
});

test('Validation fails when ABI has multiple functions with the same name', () => {
  const abi: ClarityAbi = {
    functions: [
      {
        name: 'get-value',
        access: 'public',
        args: [{ name: 'key', type: { buffer: { length: 3 } } }],
        outputs: {
          type: { response: { ok: { buffer: { length: 3 } }, error: 'int128' } },
        },
      },
      {
        name: 'get-value',
        access: 'public',
        args: [{ name: 'key', type: { buffer: { length: 3 } } }],
        outputs: {
          type: { response: { ok: { buffer: { length: 3 } }, error: 'int128' } },
        },
      },
    ],
    variables: [],
    maps: [],
    fungible_tokens: [],
    non_fungible_tokens: [],
  };

  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'kv-store';
  const functionName = 'get-value';
  const functionArgs = [trueCV(), falseCV()];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  expect(() => validateContractCall(payload, abi)).toThrow(
    'Malformed ABI. Contains multiple functions with the name get-value'
  );
});

test('Validation fails when abi is missing specified function', () => {
  const contractAddress = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'kv-store';
  const functionName = 'get-value';
  const functionArgs = [trueCV(), falseCV()];

  const payload = createContractCallPayload(
    contractAddress,
    contractName,
    functionName,
    functionArgs
  );

  expect(() => validateContractCall(payload, TEST_ABI)).toThrow(
    "ABI doesn't contain a function with the name get-value"
  );
});

test('ABI function to repr string', () => {
  expect(abiFunctionToString(TEST_ABI.functions[1])).toEqual('(define-public (hello (arg1 int)))');
});

test('Parse string input using ABI arg type', () => {
  const uintString = '123';
  const intString = '234';
  const boolStringTrue = 'True';
  const boolStringFalse = 'False';
  const standardPrincipalString = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const address = 'ST3KC0MTNW34S1ZXD36JYKFD3JJMWA01M55DSJ4JE';
  const contractName = 'kv-store';
  const contractPrincipalString = `${address}.${contractName}`;
  const bufferString = 'test 321';

  const uintFunctionArgType: ClarityAbiType = 'uint128';
  const intFunctionArgType: ClarityAbiType = 'int128';
  const boolFunctionArgType: ClarityAbiType = 'bool';
  const principalFunctionArgType: ClarityAbiType = 'principal';
  const bufferFunctionArgType: ClarityAbiType = {
    buffer: {
      length: Buffer.from(bufferString).byteLength,
    },
  };

  const uintCVResult = parseToCV(uintString, uintFunctionArgType);
  const intCVResult = parseToCV(intString, intFunctionArgType);
  const boolCVTrueResult = parseToCV(boolStringTrue, boolFunctionArgType);
  const boolCVFalseResult = parseToCV(boolStringFalse, boolFunctionArgType);
  const standardPrincipalCVResult = parseToCV(standardPrincipalString, principalFunctionArgType);
  const contractPrincipalCVResult = parseToCV(contractPrincipalString, principalFunctionArgType);
  const bufferCVResult = parseToCV(bufferString, bufferFunctionArgType);

  expect(uintCVResult).toEqual(uintCV(uintString));
  expect(intCVResult).toEqual(intCV(intString));
  expect(boolCVTrueResult).toEqual(trueCV());
  expect(boolCVFalseResult).toEqual(falseCV());
  expect(standardPrincipalCVResult).toEqual(standardPrincipalCV(standardPrincipalString));
  expect(contractPrincipalCVResult).toEqual(contractPrincipalCV(address, contractName));
  expect(bufferCVResult).toEqual(bufferCVFromString(bufferString));
});
