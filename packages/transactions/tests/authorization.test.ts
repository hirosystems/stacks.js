import {
  createMultiSigSpendingCondition,
  createSingleSigSpendingCondition,
  deserializeSpendingCondition,
  emptyMessageSignature,
  serializeAuthorization,
  serializeSpendingCondition,
  SingleSigSpendingCondition,
  SponsoredAuthorization,
  StandardAuthorization,
} from '../src/authorization';
import { createMessageSignature } from '../src/common';
import { createTransactionAuthField } from '../src/signature';
import { bytesToHex } from '../src/utils';

import { AddressHashMode, AuthType, PubKeyEncoding } from '../src/constants';

import { concatArray } from '@stacks/common';
import { ByteReader } from '../src/bytesReader';
import { createStacksPrivateKey, createStacksPublicKey, signWithKey } from '../src/keys';

test('ECDSA recoverable signature', () => {
  const privKeyString = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc';
  const messagetoSign = 'eec72e6cd1ce0ac1dd1a0c260f099a8fc72498c80b3447f962fd5d39a3d70921';
  const correctSignature =
    '019901d8b1d67a7b853dc473d0609508ab2519ec370eabfef460aa0fd9234660' +
    '787970968562da9de8b024a7f36f946b2fdcbf39b2f59247267a9d72730f19276b';
  const privKey = createStacksPrivateKey(privKeyString);
  const messageSignature = signWithKey(privKey, messagetoSign);
  expect(messageSignature.data).toBe(correctSignature);
});

test('Single spending condition serialization and deserialization', () => {
  const addressHashMode = AddressHashMode.SerializeP2PKH;
  const nonce = 0;
  const fee = 0;
  const pubKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  // const secretKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';
  const spendingCondition = createSingleSigSpendingCondition(addressHashMode, pubKey, nonce, fee);
  const emptySignature = emptyMessageSignature();

  const serialized = serializeSpendingCondition(spendingCondition);
  const deserialized = deserializeSpendingCondition(
    new ByteReader(serialized)
  ) as SingleSigSpendingCondition;
  expect(deserialized.hashMode).toBe(addressHashMode);
  expect(deserialized.nonce!.toString()).toBe(nonce.toString());
  expect(deserialized.fee!.toString()).toBe(fee.toString());
  expect(deserialized.signature.data).toBe(emptySignature.data);
});

test('Single sig spending condition uncompressed', () => {
  const addressHashMode = AddressHashMode.SerializeP2PKH;
  const nonce = 123;
  const fee = 456;
  const pubKey = '';
  const spendingCondition = createSingleSigSpendingCondition(addressHashMode, pubKey, nonce, fee);
  spendingCondition.signer = '11'.repeat(20);
  spendingCondition.keyEncoding = PubKeyEncoding.Uncompressed;

  const signature = createMessageSignature('ff'.repeat(65));
  spendingCondition.signature = signature;

  const serializedSpendingCondition = serializeSpendingCondition(spendingCondition);

  // prettier-ignore
  const spendingConditionBytesHex = [
    // address hash mode
    AddressHashMode.SerializeP2PKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11, 0x11, 0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7b,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // key encoding,
    PubKeyEncoding.Uncompressed,
    // signature
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff
  ]
  const spendingConditionBytes = new Uint8Array(spendingConditionBytesHex);

  expect(bytesToHex(serializedSpendingCondition)).toEqual(bytesToHex(spendingConditionBytes));
});

test('Multi sig spending condition uncompressed', () => {
  const addressHashMode = AddressHashMode.SerializeP2SH;
  const nonce = 123;
  const fee = 456;
  const pubKey = '02'.repeat(33);
  const pubKeys = [pubKey, pubKey, pubKey];

  const spendingCondition = createMultiSigSpendingCondition(
    addressHashMode,
    2,
    pubKeys,
    nonce,
    fee
  );
  spendingCondition.signer = '11'.repeat(20);

  const signature = createMessageSignature('ff'.repeat(65));
  const fields = [signature, signature, createStacksPublicKey(pubKeys[2])];
  spendingCondition.fields = fields.map(sig =>
    createTransactionAuthField(PubKeyEncoding.Compressed, sig)
  );

  const serializedSpendingCondition = serializeSpendingCondition(spendingCondition);

  // prettier-ignore
  const spendingConditionBytesHex = [
    // address hash mode
    AddressHashMode.SerializeP2SH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11, 0x11, 0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7b,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // length prefixed list of fields
    0x00, 0x00, 0x00, 0x03,
    0x02, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff,
    0x02, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02, 0x02,
    // required signatures
    0x00, 0x02
  ];

  const spendingConditionBytes = new Uint8Array(spendingConditionBytesHex);

  expect(bytesToHex(serializedSpendingCondition)).toEqual(bytesToHex(spendingConditionBytes));
});

// auth.rs: tx_stacks_spending_condition_p2sh() (compressed multisig)
test('Multi sig P2SH spending condition compressed', () => {
  const addressHashMode = AddressHashMode.SerializeP2SH;
  const nonce = 456;
  const fee = 567;
  const pubKey = '03ef2340518b5867b23598a9cf74611f8b98064f7d55cdb8c107c67b5efcbc5c77';
  const pubKeys = [pubKey, pubKey, pubKey];

  const spendingCondition = createMultiSigSpendingCondition(
    addressHashMode,
    2,
    pubKeys,
    nonce,
    fee
  );
  spendingCondition.signer = '11'.repeat(20);

  const signature1 = createMessageSignature('ff'.repeat(65));
  const signature2 = createMessageSignature('fe'.repeat(65));
  const fields = [signature1, signature2, createStacksPublicKey(pubKeys[0])];
  spendingCondition.fields = fields.map(sig =>
    createTransactionAuthField(PubKeyEncoding.Compressed, sig)
  );

  const serializedSpendingCondition = serializeSpendingCondition(spendingCondition);

  // prettier-ignore
  const spendingConditionBytesHex = [
    // address hash mode
    AddressHashMode.SerializeP2SH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11, 0x11, 0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // length prefixed list of fields
    0x00, 0x00, 0x00, 0x03,
    0x02, // AuthFieldType.SignatureCompressed,
    // [...Buffer.from(signature1.data, 'hex')],
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff,
    0x02, // AuthFieldType.SignatureCompressed,
    // [...Buffer.from(signature2.data, 'hex')],
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0x00, // PubKeyEncoding.Compressed,
    // [...fields[2].data as Buffer],
    0x03, 0xef, 0x23, 0x40, 0x51, 0x8b, 0x58, 0x67, 0xb2, 0x35, 0x98, 0xa9, 0xcf, 0x74, 0x61,
    0x1f, 0x8b, 0x98, 0x06, 0x4f, 0x7d, 0x55, 0xcd, 0xb8, 0xc1, 0x07, 0xc6, 0x7b, 0x5e, 0xfc,
    0xbc, 0x5c, 0x77,
    // required signatures
    0x00, 0x02
  ].flat();

  const spendingConditionBytes = new Uint8Array(spendingConditionBytesHex);

  expect(serializedSpendingCondition).toEqual(spendingConditionBytes);
});

// auth.rs: tx_stacks_spending_condition_p2wsh()
test('Multi sig P2WSH spending condition compressed', () => {
  const addressHashMode = AddressHashMode.SerializeP2WSH;
  const nonce = 456;
  const fee = 567;
  const pubKey = '03ef2340518b5867b23598a9cf74611f8b98064f7d55cdb8c107c67b5efcbc5c77';
  const pubKeys = [pubKey, pubKey, pubKey];

  const spendingCondition = createMultiSigSpendingCondition(
    addressHashMode,
    2,
    pubKeys,
    nonce,
    fee
  );
  spendingCondition.signer = '11'.repeat(20);

  const signature1 = createMessageSignature('ff'.repeat(65));
  const signature2 = createMessageSignature('fe'.repeat(65));
  const fields = [signature1, signature2, createStacksPublicKey(pubKeys[0])];
  spendingCondition.fields = fields.map(sig =>
    createTransactionAuthField(PubKeyEncoding.Compressed, sig)
  );

  const serializedSpendingCondition = serializeSpendingCondition(spendingCondition);

  // prettier-ignore
  const spendingConditionBytesHex = [
    // address hash mode
    AddressHashMode.SerializeP2WSH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11, 0x11, 0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // length prefixed list of fields
    0x00, 0x00, 0x00, 0x03,
    0x02, // AuthFieldType.SignatureCompressed,
    // [...Buffer.from(signature1.data, 'hex')],
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff,
    0x02, // AuthFieldType.SignatureCompressed,
    // [...Buffer.from(signature2.data, 'hex')],
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0x00, // PubKeyEncoding.Compressed,
    // [...fields[2].data as Buffer],
    0x03, 0xef, 0x23, 0x40, 0x51, 0x8b, 0x58, 0x67, 0xb2, 0x35, 0x98, 0xa9, 0xcf, 0x74, 0x61,
    0x1f, 0x8b, 0x98, 0x06, 0x4f, 0x7d, 0x55, 0xcd, 0xb8, 0xc1, 0x07, 0xc6, 0x7b, 0x5e, 0xfc,
    0xbc, 0x5c, 0x77,
    // required signatures
    0x00, 0x02
  ].flat();

  const spendingConditionBytes = new Uint8Array(spendingConditionBytesHex);

  expect(serializedSpendingCondition).toEqual(spendingConditionBytes);
});

// auth.rs: tx_stacks_auth()
test('Spending conditions', () => {
  const bn123 = 123;
  const bn345 = 345;
  const bn456 = 456;
  const bn567 = 567;
  const signer = '11'.repeat(20);
  const signatureFF = createMessageSignature('ff'.repeat(65));
  const signatureFE = createMessageSignature('fe'.repeat(65));
  const pubKeyUncompressed =
    '04ef2340518b5867b23598a9cf74611f8b98064f7d55cdb8c107c67b5efcbc5c771f112f919b00a6c6c5f51f7c63e1762fe9fac9b66ec75a053db7f51f4a52712b';
  const pubKeyCompressed = '03ef2340518b5867b23598a9cf74611f8b98064f7d55cdb8c107c67b5efcbc5c77';

  const sp1 = createSingleSigSpendingCondition(AddressHashMode.SerializeP2PKH, '', bn123, bn567);
  sp1.signer = signer;
  sp1.keyEncoding = PubKeyEncoding.Uncompressed;
  sp1.signature = signatureFF;

  const sp2 = createSingleSigSpendingCondition(AddressHashMode.SerializeP2PKH, '', bn345, bn567);
  sp2.signer = signer;
  sp2.keyEncoding = PubKeyEncoding.Compressed;
  sp2.signature = signatureFF;

  const sp3 = createMultiSigSpendingCondition(
    AddressHashMode.SerializeP2SH,
    2,
    [pubKeyUncompressed, pubKeyUncompressed, pubKeyUncompressed],
    bn123,
    bn567
  );
  sp3.signer = signer;
  sp3.fields = [signatureFF, signatureFE, createStacksPublicKey(pubKeyUncompressed)].map(sig =>
    createTransactionAuthField(PubKeyEncoding.Uncompressed, sig)
  );

  const sp4 = createMultiSigSpendingCondition(
    AddressHashMode.SerializeP2SH,
    2,
    [pubKeyCompressed, pubKeyCompressed, pubKeyCompressed],
    bn123,
    bn567
  );
  sp4.signer = signer;
  sp4.fields = [signatureFF, signatureFE, createStacksPublicKey(pubKeyCompressed)].map(sig =>
    createTransactionAuthField(PubKeyEncoding.Compressed, sig)
  );

  const sp5 = createSingleSigSpendingCondition(AddressHashMode.SerializeP2WPKH, '', bn345, bn567);
  sp5.signer = signer;
  sp5.keyEncoding = PubKeyEncoding.Compressed;
  sp5.signature = signatureFE;

  const sp6 = createMultiSigSpendingCondition(
    AddressHashMode.SerializeP2WSH,
    2,
    [pubKeyCompressed, pubKeyCompressed, pubKeyCompressed],
    bn456,
    bn567
  );
  sp6.signer = signer;
  sp6.fields = [signatureFF, signatureFE, createStacksPublicKey(pubKeyCompressed)].map(sig =>
    createTransactionAuthField(PubKeyEncoding.Compressed, sig)
  );

  const spendingConditions = [sp1, sp2, sp3, sp4, sp5, sp6];

  for (let i = 0; i < spendingConditions.length; i++) {
    const serialized1 = serializeSpendingCondition(spendingConditions[i]);
    const serialized2 = serializeSpendingCondition(
      spendingConditions[(i + 1) % spendingConditions.length]
    );

    const standard: StandardAuthorization = {
      authType: AuthType.Standard,
      spendingCondition: spendingConditions[i],
    };
    const standardArray = [];
    standardArray.push(AuthType.Standard);
    standardArray.push(serialized1);
    const standardBytes = concatArray(standardArray);

    const sponsored: SponsoredAuthorization = {
      authType: AuthType.Sponsored,
      spendingCondition: spendingConditions[i],
      sponsorSpendingCondition: spendingConditions[(i + 1) % spendingConditions.length],
    };
    const sponsoredArray = [];
    sponsoredArray.push(AuthType.Sponsored);
    sponsoredArray.push(serialized1);
    sponsoredArray.push(serialized2);
    const sponsoredBytes = concatArray(sponsoredArray);

    expect(serializeAuthorization(standard)).toEqual(standardBytes);
    expect(serializeAuthorization(sponsored)).toEqual(sponsoredBytes);
  }
});

// auth.rs: tx_stacks_invalid_spending_conditions()
test('Invalid spending conditions', () => {
  // prettier-ignore
  const badHashModeBytesHex = [
    // singlesig
    // hash mode
    0xff,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // key encoding,
    PubKeyEncoding.Compressed,
    // signature
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
  ];

  const badHashModeSpendingConditionBytes = new Uint8Array(badHashModeBytesHex);

  expect(() =>
    deserializeSpendingCondition(new ByteReader(badHashModeSpendingConditionBytes))
  ).toThrow('Could not parse 255 as AddressHashMode');

  // prettier-ignore
  const badHashModeMultiSigBytesHex = [
    // hash mode
    AddressHashMode.SerializeP2SH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // key encoding,
    PubKeyEncoding.Compressed,
    // signature
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
    0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd, 0xfd,
  ];

  const badHashModeMultiSigSependingCondBytes = new Uint8Array(badHashModeMultiSigBytesHex);

  expect(() =>
    deserializeSpendingCondition(new ByteReader(badHashModeMultiSigSependingCondBytes))
  ).toThrow('Could not read 253 as AuthFieldType');

  // this will parse into a singlesig spending condition, but data will still remain.
  // the reason it parses is because the public keys length field encodes a valid 2-byte
  // prefix of a public key, and the parser will lump it into a public key
  // prettier-ignore
  const badHashModeSinglesigBytesParseable = [
    // hash mode
    AddressHashMode.SerializeP2PKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce (embeds key encoding and part of the parsed nonce)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // number of fields (embed part of the signature)
    0x00, 0x00, 0x00, 0x01,
    // field #1: signature
    0x02, // AuthFieldType.SignatureCompressed
    // field #1: signature
    0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    // number of signatures
    0x00,
    0x01,
  ];

  const badHashModeSinglesigBytesParseableBuffer = new Uint8Array(
    badHashModeSinglesigBytesParseable
  );

  const deserializedBadHashModeSinglesigBytesParseable = deserializeSpendingCondition(
    new ByteReader(badHashModeSinglesigBytesParseableBuffer)
  );

  // corrupt but will parse with trailing bits
  expect(deserializedBadHashModeSinglesigBytesParseable).toBeTruthy();

  // wrong number of public keys (too many signatures)
  // prettier-ignore
  const badPublicKeyCountBytes = [
    // hash mode
    AddressHashMode.SerializeP2SH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // fields length
    0x00, 0x00, 0x00, 0x03,
    // field #1: signature
    // TransactionAuthFieldID::SignatureCompressed as u8,
    0x02, // AuthFieldType.SignatureCompressed
    // field #1: signature
    0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    // field #2: signature
    // TransactionAuthFieldID::SignatureCompressed as u8,
    0x02, // AuthFieldType.SignatureCompressed
    // filed #2: signature
    0x02, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    // field #3: public key
    // TransactionAuthFieldID::PublicKeyCompressed as u8,
    0x00,
    // field #3: key (compressed)
    0x03, 0xef, 0x23, 0x40, 0x51, 0x8b, 0x58, 0x67, 0xb2, 0x35, 0x98, 0xa9, 0xcf, 0x74, 0x61, 0x1f, 0x8b, 0x98, 0x06,
    0x4f, 0x7d, 0x55, 0xcd, 0xb8, 0xc1, 0x07, 0xc6, 0x7b, 0x5e, 0xfc, 0xbc, 0x5c, 0x77,
    // number of signatures
    0x00, 0x01,
  ];

  // wrong number of public keys (not enough signatures)
  // prettier-ignore
  const badPublicKeyCountBytes2 = [
    // hash mode
    AddressHashMode.SerializeP2SH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // fields length
    0x00, 0x00, 0x00, 0x03,
    // field #1: signature
    0x02,
    // field #1: signature
    0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    // field #2: signature
    // TransactionAuthFieldID::SignatureCompressed as u8,
    0x02,
    // filed #2: signature
    0x02, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    // field #3: public key
    0x00,
    // field #3: key (compressed)
    0x03, 0xef, 0x23, 0x40, 0x51, 0x8b, 0x58, 0x67, 0xb2, 0x35, 0x98, 0xa9, 0xcf, 0x74, 0x61, 0x1f, 0x8b, 0x98, 0x06,
    0x4f, 0x7d, 0x55, 0xcd, 0xb8, 0xc1, 0x07, 0xc6, 0x7b, 0x5e, 0xfc, 0xbc, 0x5c, 0x77,
    // number of signatures
    0x00, 0x03,
  ];

  const badPublicKeyCountBuffer = new Uint8Array(badPublicKeyCountBytes);

  // Partially signed multi-sig tx can be serialized and deserialized without exception (Incorrect number of signatures)
  // Should be able to deserialize as number of signatures are less than signatures required
  expect(() =>
    deserializeSpendingCondition(new ByteReader(badPublicKeyCountBuffer))
  ).not.toThrowError();

  const badPublicKeyCount2Buffer = new Uint8Array(badPublicKeyCountBytes2);

  // Partially signed multi-sig tx can be serialized and deserialized without exception (Incorrect number of signatures)
  // Should be able to deserialize as number of signatures are less than signatures required
  expect(() =>
    deserializeSpendingCondition(new ByteReader(badPublicKeyCount2Buffer))
  ).not.toThrowError();

  // hashing mode doesn't allow uncompressed keys
  const signatureFF = createMessageSignature('ff'.repeat(65));
  const badP2WpkhUncompressedSP = createSingleSigSpendingCondition(
    AddressHashMode.SerializeP2WPKH,
    '',
    123,
    567
  );
  badP2WpkhUncompressedSP.signer = '11'.repeat(20);
  badP2WpkhUncompressedSP.keyEncoding = PubKeyEncoding.Uncompressed;
  badP2WpkhUncompressedSP.signature = signatureFF;

  // prettier-ignore
  const badP2WpkhUncompressedBytes = [
    // hash mode
    AddressHashMode.SerializeP2WPKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7b,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // public key uncompressed
    0x01,
    // signature
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  ];

  // we can serialize the invalid p2wpkh uncompressed condition, but we can't deserialize it
  const serializedSPUncompressedKeys = serializeSpendingCondition(badP2WpkhUncompressedSP);

  expect(new Uint8Array(badP2WpkhUncompressedBytes)).toEqual(serializedSPUncompressedKeys);
  expect(() =>
    deserializeSpendingCondition(new ByteReader(new Uint8Array(badP2WpkhUncompressedBytes)))
  ).toThrow(
    'Failed to parse singlesig spending condition: incomaptible hash mode and key encoding'
  );
});

// auth.rs: tx_stacks_spending_condition_p2pkh()
test('Single sig P2PKH spending condition', () => {
  // p2pkh
  const spP2PkhUncompressed = createSingleSigSpendingCondition(
    AddressHashMode.SerializeP2PKH,
    '',
    123,
    456
  );
  spP2PkhUncompressed.keyEncoding = PubKeyEncoding.Uncompressed;

  const signature = createMessageSignature('ff'.repeat(65));
  spP2PkhUncompressed.signature = signature;
  spP2PkhUncompressed.signer = '11'.repeat(20);

  // prettier-ignore
  const spendingConditionP2PkhUncompressedBytes = [
    // address hash mode
    AddressHashMode.SerializeP2PKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11, 0x11, 0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7b,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // key encoding,
    PubKeyEncoding.Uncompressed,
    // signature
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff
  ];

  const spP2PkhCompressed = createSingleSigSpendingCondition(
    AddressHashMode.SerializeP2PKH,
    '',
    345,
    456
  );
  spP2PkhCompressed.keyEncoding = PubKeyEncoding.Compressed;

  spP2PkhCompressed.signature = createMessageSignature('fe'.repeat(65));
  spP2PkhCompressed.signer = '11'.repeat(20);

  // prettier-ignore

  const spendingConditionP2PkhCompressedBytes = [
    // hash mode
    AddressHashMode.SerializeP2PKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x59,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc8,
    // key encoding
    PubKeyEncoding.Compressed,
    // signature
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
  ];

  const spendingConditions = [spP2PkhCompressed, spP2PkhUncompressed];
  const spendingConditionsBytes = [
    spendingConditionP2PkhCompressedBytes,
    spendingConditionP2PkhUncompressedBytes,
  ];

  for (let i = 0; i < spendingConditions.length; i++) {
    const serializedSpendingCondition = serializeSpendingCondition(spendingConditions[i]);
    expect(bytesToHex(serializedSpendingCondition)).toEqual(
      bytesToHex(new Uint8Array(spendingConditionsBytes[i]))
    );
    const spendingCondition = deserializeSpendingCondition(
      new ByteReader(serializedSpendingCondition)
    );
    expect(spendingCondition).toEqual(spendingConditions[i]);
  }
});

// auth.rs: tx_stacks_spending_condition_p2wpkh()
test('Single sig P2WPKH spending condition', () => {
  // P2WPKH
  const spP2WPKHCompressed = createSingleSigSpendingCondition(
    AddressHashMode.SerializeP2WPKH,
    '',
    345,
    567
  );
  spP2WPKHCompressed.keyEncoding = PubKeyEncoding.Compressed;

  const signature = createMessageSignature('fe'.repeat(65));
  spP2WPKHCompressed.signature = signature;
  spP2WPKHCompressed.signer = '11'.repeat(20);

  // prettier-ignore
  let spendingConditionP2WpkhCompressedBytes = [
    // hash mode
    AddressHashMode.SerializeP2WPKH,
    // signer
    0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
    0x11, 0x11,
    // nonce
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x59,
    // fee rate
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x37,
    // key encoding
    PubKeyEncoding.Compressed,
    // signature
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
    0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
  ];

  const spendingConditions = [spP2WPKHCompressed];
  const spendingConditionsBytes = [spendingConditionP2WpkhCompressedBytes];

  for (let i = 0; i < spendingConditions.length; i++) {
    const serializedSpendingCondition = serializeSpendingCondition(spendingConditions[i]);
    expect(bytesToHex(serializedSpendingCondition)).toEqual(
      bytesToHex(new Uint8Array(spendingConditionsBytes[i]))
    );
    const spendingCondition = deserializeSpendingCondition(
      new ByteReader(serializedSpendingCondition)
    );
    expect(spendingCondition).toEqual(spendingConditions[i]);
  }
});
