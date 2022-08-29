import {
  TokenTransferPayload,
  ContractCallPayload,
  SmartContractPayload,
  CoinbasePayload,
  createSmartContractPayload,
  createCoinbasePayload,
  createContractCallPayload,
  createTokenTransferPayload,
  VersionedSmartContractPayload,
} from '../src/payload';

import { serializeDeserialize } from './macros';

import { trueCV, falseCV, standardPrincipalCV, contractPrincipalCV } from '../src/clarity';

import { ClarityVersion, COINBASE_BUFFER_LENGTH_BYTES, StacksMessageType } from '../src/constants';
import { principalToString } from '../src/clarity/types/principalCV';

test('STX token transfer payload serialization and deserialization', () => {
  const recipient = standardPrincipalCV('SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159');
  const amount = 2500000;

  const payload = createTokenTransferPayload(recipient, amount, 'memo (not being included)');

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as TokenTransferPayload;
  expect(deserialized.payloadType).toBe(payload.payloadType);
  expect(deserialized.recipient).toEqual(recipient);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('STX token transfer payload (to contract addr)  serialization and deserialization', () => {
  const recipient = contractPrincipalCV(
    'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
    'contract-name'
  );
  const amount = 2500000;

  const payload = createTokenTransferPayload(recipient, amount, 'memo (not being included)');

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as TokenTransferPayload;
  expect(deserialized.payloadType).toBe(payload.payloadType);
  expect(deserialized.recipient).toEqual(recipient);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('STX token transfer payload (with contract principal string) serialization and deserialization', () => {
  const recipient = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159.contract-name';
  const amount = 2500000;

  const payload = createTokenTransferPayload(recipient, amount, 'memo (not being included)');

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as TokenTransferPayload;
  expect(deserialized.payloadType).toBe(payload.payloadType);
  expect(principalToString(deserialized.recipient)).toEqual(recipient);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('STX token transfer payload (with address principal string) serialization and deserialization', () => {
  const recipient = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const amount = 2500000;

  const payload = createTokenTransferPayload(recipient, amount, 'memo (not being included)');

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as TokenTransferPayload;
  expect(deserialized.payloadType).toBe(payload.payloadType);
  expect(principalToString(deserialized.recipient)).toEqual(recipient);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('Contract call payload serialization and deserialization', () => {
  const contractAddress = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const contractName = 'contract_name';
  const functionName = 'function_name';
  const args = [trueCV(), falseCV()];

  const payload = createContractCallPayload(contractAddress, contractName, functionName, args);

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as ContractCallPayload;
  expect(deserialized).toEqual(payload);
});

test('Smart contract payload serialization and deserialization', () => {
  const contractName = 'contract_name';
  const codeBody =
    '(define-map store ((key (buff 32))) ((value (buff 32))))' +
    '(define-public (get-value (key (buff 32)))' +
    '   (match (map-get? store ((key key)))' +
    '       entry (ok (get value entry))' +
    '       (err 0)))' +
    '(define-public (set-value (key (buff 32)) (value (buff 32)))' +
    '   (begin' +
    '       (map-set store ((key key)) ((value value)))' +
    "       (ok 'true)))";

  const payload = createSmartContractPayload(contractName, codeBody);

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as SmartContractPayload;
  expect(deserialized.contractName.content).toBe(contractName);
  expect(deserialized.codeBody.content).toBe(codeBody);
});

test('Versioned smart contract payload serialization and deserialization', () => {
  const contractName = 'contract_name';
  const codeBody =
    '(define-map store ((key (buff 32))) ((value (buff 32))))' +
    '(define-public (get-value (key (buff 32)))' +
    '   (match (map-get? store ((key key)))' +
    '       entry (ok (get value entry))' +
    '       (err 0)))' +
    '(define-public (set-value (key (buff 32)) (value (buff 32)))' +
    '   (begin' +
    '       (map-set store ((key key)) ((value value)))' +
    "       (ok 'true)))";

  const payload = createSmartContractPayload(contractName, codeBody, ClarityVersion.Clarity2);

  const deserialized = serializeDeserialize(
    payload,
    StacksMessageType.Payload
  ) as VersionedSmartContractPayload;
  expect(deserialized.clarityVersion).toBe(2);
  expect(deserialized.contractName.content).toBe(contractName);
  expect(deserialized.codeBody.content).toBe(codeBody);
});

test('Coinbase payload serialization and deserialization', () => {
  const coinbaseBuffer = Buffer.alloc(COINBASE_BUFFER_LENGTH_BYTES, 0);
  coinbaseBuffer.write('coinbase buffer');

  const payload = createCoinbasePayload(coinbaseBuffer);

  const deserialized = serializeDeserialize(payload, StacksMessageType.Payload) as CoinbasePayload;
  expect(deserialized.coinbaseBuffer.toString()).toBe(coinbaseBuffer.toString());
});
