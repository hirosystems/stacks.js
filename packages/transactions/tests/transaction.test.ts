import { StacksTransaction, deserializeTransaction } from '../src/transaction';

import {
  StandardAuthorization,
  createSingleSigSpendingCondition,
  SingleSigSpendingCondition,
  createMultiSigSpendingCondition,
  MultiSigSpendingCondition,
  Authorization,
  serializeSpendingCondition,
  deserializeSpendingCondition,
  SponsoredAuthorization,
} from '../src/authorization';

import { TokenTransferPayload, createTokenTransferPayload } from '../src/payload';

import { STXPostCondition, createSTXPostCondition } from '../src/postcondition';

import {
  createLPList,
  createStandardPrincipal,
  serializeLPList,
  deserializeLPList,
} from '../src/types';

import {
  DEFAULT_CHAIN_ID,
  TransactionVersion,
  AnchorMode,
  PostConditionMode,
  AuthType,
  FungibleConditionCode,
  AddressHashMode,
  AddressVersion,
  StacksMessageType,
} from '../src/constants';

import { hashP2PKH } from '../src/utils';

import {
  createStacksPrivateKey,
  pubKeyfromPrivKey,
  publicKeyToString,
  createStacksPublicKey,
  serializePublicKey,
  deserializePublicKey,
} from '../src/keys';

import { TransactionSigner } from '../src/signer';

import BigNum from 'bn.js';
import fetchMock from 'jest-fetch-mock';
import { BufferReader } from '../src/bufferReader';
import { standardPrincipalCV } from '../src/clarity';

beforeEach(() => {
  fetchMock.resetMocks();
});

test('STX token transfer transaction serialization and deserialization', () => {
  const transactionVersion = TransactionVersion.Testnet;
  const chainId = DEFAULT_CHAIN_ID;

  const anchorMode = AnchorMode.Any;
  const postConditionMode = PostConditionMode.Deny;

  const address = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const recipient = createStandardPrincipal(address);
  const recipientCV = standardPrincipalCV(address);
  const amount = new BigNum(2500000);
  const memo = 'memo (not included';

  const payload = createTokenTransferPayload(recipientCV, amount, memo);

  const addressHashMode = AddressHashMode.SerializeP2PKH;
  const nonce = new BigNum(0);
  const fee = new BigNum(0);
  const pubKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  const secretKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';
  const spendingCondition = createSingleSigSpendingCondition(addressHashMode, pubKey, nonce, fee);
  const authType = AuthType.Standard;
  const authorization = new StandardAuthorization(spendingCondition);

  const postCondition = createSTXPostCondition(
    recipient,
    FungibleConditionCode.GreaterEqual,
    new BigNum(0)
  );

  const postConditions = createLPList([postCondition]);
  const transaction = new StacksTransaction(
    transactionVersion,
    authorization,
    payload,
    postConditions
  );

  const signer = new TransactionSigner(transaction);
  signer.signOrigin(createStacksPrivateKey(secretKey));
  const signature =
    '01051521ac2ac6e6123dcaf9dba000e0005d9855bcc1bc6b96aaf8b6a385238a2317' +
    'ab21e489aca47af3288cdaebd358b0458a9159cadc314cecb7dd08043c0a6d';

  const serialized = transaction.serialize();
  const deserialized = deserializeTransaction(new BufferReader(serialized));
  expect(deserialized.version).toBe(transactionVersion);
  expect(deserialized.chainId).toBe(chainId);
  expect(deserialized.auth.authType).toBe(authType);
  expect((deserialized.auth.spendingCondition! as SingleSigSpendingCondition).hashMode).toBe(
    addressHashMode
  );
  expect(deserialized.auth.spendingCondition!.nonce!.toNumber()).toBe(nonce.toNumber());
  expect(deserialized.auth.spendingCondition!.fee!.toNumber()).toBe(fee.toNumber());
  expect(deserialized.anchorMode).toBe(anchorMode);
  expect(deserialized.postConditionMode).toBe(postConditionMode);
  expect(deserialized.postConditions.values.length).toBe(1);

  const deserializedPostCondition = deserialized.postConditions.values[0] as STXPostCondition;
  expect(deserializedPostCondition.principal.address).toStrictEqual(recipient.address);
  expect(deserializedPostCondition.conditionCode).toBe(FungibleConditionCode.GreaterEqual);
  expect(deserializedPostCondition.amount.toNumber()).toBe(0);

  const deserializedPayload = deserialized.payload as TokenTransferPayload;
  expect(deserializedPayload.recipient).toEqual(recipientCV);
  expect(deserializedPayload.amount.toNumber()).toBe(amount.toNumber());
});

test('STX token transfer transaction fee setting', () => {
  const transactionVersion = TransactionVersion.Testnet;
  const chainId = DEFAULT_CHAIN_ID;

  const anchorMode = AnchorMode.Any;
  const postConditionMode = PostConditionMode.Deny;

  const address = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const recipient = createStandardPrincipal(address);
  const recipientCV = standardPrincipalCV(address);
  const amount = new BigNum(2500000);
  const memo = 'memo (not included';

  const payload = createTokenTransferPayload(recipientCV, amount, memo);

  const addressHashMode = AddressHashMode.SerializeP2PKH;
  const nonce = new BigNum(0);
  const fee = new BigNum(0);
  const pubKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  const secretKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';
  const spendingCondition = createSingleSigSpendingCondition(addressHashMode, pubKey, nonce, fee);
  const authType = AuthType.Standard;
  const authorization = new StandardAuthorization(spendingCondition);

  const postCondition = createSTXPostCondition(
    recipient,
    FungibleConditionCode.GreaterEqual,
    new BigNum(0)
  );

  const postConditions = createLPList([postCondition]);

  const transaction = new StacksTransaction(
    transactionVersion,
    authorization,
    payload,
    postConditions
  );

  const signer = new TransactionSigner(transaction);
  signer.signOrigin(createStacksPrivateKey(secretKey));
  const signature =
    '01051521ac2ac6e6123dcaf9dba000e0005d9855bcc1bc6b96aaf8b6a385238a2317' +
    'ab21e489aca47af3288cdaebd358b0458a9159cadc314cecb7dd08043c0a6d';

  const serialized = transaction.serialize();
  const deserialized = deserializeTransaction(new BufferReader(serialized));
  expect(deserialized.auth.spendingCondition!.fee!.toNumber()).toBe(fee.toNumber());

  const setFee = new BigNum(123);
  transaction.setFee(setFee);

  const postSetFeeSerialized = transaction.serialize();
  const postSetFeeDeserialized = deserializeTransaction(new BufferReader(postSetFeeSerialized));
  expect(postSetFeeDeserialized.version).toBe(transactionVersion);
  expect(postSetFeeDeserialized.chainId).toBe(chainId);
  expect(postSetFeeDeserialized.auth.authType).toBe(authType);
  expect(
    (postSetFeeDeserialized.auth.spendingCondition! as SingleSigSpendingCondition).hashMode
  ).toBe(addressHashMode);
  expect(postSetFeeDeserialized.auth.spendingCondition!.nonce!.toNumber()).toBe(nonce.toNumber());
  expect(postSetFeeDeserialized.auth.spendingCondition!.fee!.toNumber()).toBe(setFee.toNumber());
  expect(postSetFeeDeserialized.anchorMode).toBe(anchorMode);
  expect(postSetFeeDeserialized.postConditionMode).toBe(postConditionMode);
  expect(postSetFeeDeserialized.postConditions.values.length).toBe(1);

  const deserializedPostCondition = postSetFeeDeserialized.postConditions
    .values[0] as STXPostCondition;
  expect(deserializedPostCondition.principal.address).toStrictEqual(recipient.address);
  expect(deserializedPostCondition.conditionCode).toBe(FungibleConditionCode.GreaterEqual);
  expect(deserializedPostCondition.amount.toNumber()).toBe(0);

  const deserializedPayload = postSetFeeDeserialized.payload as TokenTransferPayload;
  expect(deserializedPayload.recipient).toEqual(recipientCV);
  expect(deserializedPayload.amount.toNumber()).toBe(amount.toNumber());
});

test('STX token transfer transaction multi-sig serialization and deserialization', () => {
  const addressHashMode = AddressHashMode.SerializeP2SH;
  const nonce = new BigNum(0);
  const fee = new BigNum(0);

  const privKeyStrings = [
    '6d430bb91222408e7706c9001cfaeb91b08c2be6d5ac95779ab52c6b431950e001',
    '2a584d899fed1d24e26b524f202763c8ab30260167429f157f1c119f550fa6af01',
    'd5200dee706ee53ae98a03fba6cf4fdcc5084c30cfa9e1b3462dcdeaa3e0f1d201',
  ];
  const privKeys = privKeyStrings.map(createStacksPrivateKey);

  const pubKeys = privKeyStrings.map(pubKeyfromPrivKey);
  const pubKeyStrings = pubKeys.map(publicKeyToString);

  const spendingCondition = createMultiSigSpendingCondition(
    addressHashMode,
    2,
    pubKeyStrings,
    nonce,
    fee
  );
  const authType = AuthType.Standard;
  const originAuth = new StandardAuthorization(spendingCondition);

  const originAddress = originAuth.spendingCondition?.signer;

  expect(originAddress).toEqual('a23ea89d6529ac48ac766f720e480beec7f19273');

  const transactionVersion = TransactionVersion.Mainnet;
  const chainId = DEFAULT_CHAIN_ID;

  const anchorMode = AnchorMode.Any;

  const address = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const recipientCV = standardPrincipalCV(address);
  const amount = new BigNum(2500000);

  const memo = 'memo';

  const payload = createTokenTransferPayload(recipientCV, amount, memo);

  const transaction = new StacksTransaction(transactionVersion, originAuth, payload);

  const signer = new TransactionSigner(transaction);
  signer.signOrigin(privKeys[0]);
  signer.signOrigin(privKeys[1]);
  signer.appendOrigin(pubKeys[2]);

  const serialized = transaction.serialize();
  const deserialized = deserializeTransaction(new BufferReader(serialized));
  expect(deserialized.version).toBe(transactionVersion);
  expect(deserialized.chainId).toBe(chainId);
  expect(deserialized.auth.authType).toBe(authType);
  expect((deserialized.auth.spendingCondition! as MultiSigSpendingCondition).hashMode).toBe(
    addressHashMode
  );
  expect(deserialized.auth.spendingCondition!.nonce!.toNumber()).toBe(nonce.toNumber());
  expect(deserialized.auth.spendingCondition!.fee!.toNumber()).toBe(fee.toNumber());
  expect(deserialized.anchorMode).toBe(anchorMode);
  expect(deserialized.postConditionMode).toBe(PostConditionMode.Deny);
  expect(deserialized.postConditions.values.length).toBe(0);

  const deserializedPayload = deserialized.payload as TokenTransferPayload;
  expect(deserializedPayload.recipient).toEqual(recipientCV);
  expect(deserializedPayload.amount.toNumber()).toBe(amount.toNumber());
});

test('Sponsored STX token transfer transaction serialization and deserialization', () => {
  const transactionVersion = TransactionVersion.Testnet;
  const chainId = DEFAULT_CHAIN_ID;

  const anchorMode = AnchorMode.Any;
  const postConditionMode = PostConditionMode.Deny;

  const address = 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159';
  const recipient = createStandardPrincipal(address);
  const recipientCV = standardPrincipalCV(address);
  const amount = new BigNum(2500000);
  const memo = 'memo (not included';

  const payload = createTokenTransferPayload(recipientCV, amount, memo);

  const addressHashMode = AddressHashMode.SerializeP2PKH;
  const nonce = new BigNum(0);
  const sponsorNonce = new BigNum(123);
  const fee = new BigNum(0);
  const pubKey = '03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab';
  const secretKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';
  const sponsorPubKey = '02b6cfeae7cdcd7ae9229e2decc7d75fe727f8dc9f0d81e58aaf46de550d8e3f58';
  const sponsorSecretKey = '3372fdabb09819bb6c9446da8a067840c81dcf8d229d048de36caac3562c5f7301';
  const spendingCondition = createSingleSigSpendingCondition(addressHashMode, pubKey, nonce, fee);
  const sponsorSpendingCondition = createSingleSigSpendingCondition(
    addressHashMode,
    sponsorPubKey,
    sponsorNonce,
    fee
  );

  const authType = AuthType.Sponsored;
  const authorization = new SponsoredAuthorization(spendingCondition, sponsorSpendingCondition);

  const transaction = new StacksTransaction(transactionVersion, authorization, payload);

  const signer = new TransactionSigner(transaction);
  signer.signOrigin(createStacksPrivateKey(secretKey));
  signer.signSponsor(createStacksPrivateKey(sponsorSecretKey));

  const serialized = transaction.serialize();
  const deserialized = deserializeTransaction(new BufferReader(serialized));
  expect(deserialized.version).toBe(transactionVersion);
  expect(deserialized.chainId).toBe(chainId);
  expect(deserialized.auth.authType).toBe(authType);
  expect(deserialized.auth.spendingCondition!.hashMode).toBe(addressHashMode);
  expect(deserialized.auth.spendingCondition!.nonce!.toNumber()).toBe(nonce.toNumber());
  expect(deserialized.auth.spendingCondition!.fee!.toNumber()).toBe(fee.toNumber());
  expect(deserialized.auth.sponsorSpendingCondition!.hashMode).toBe(addressHashMode);
  expect(deserialized.auth.sponsorSpendingCondition!.nonce!.toNumber()).toBe(
    sponsorNonce.toNumber()
  );
  expect(deserialized.auth.sponsorSpendingCondition!.fee!.toNumber()).toBe(fee.toNumber());
  expect(deserialized.anchorMode).toBe(anchorMode);
  expect(deserialized.postConditionMode).toBe(postConditionMode);

  const deserializedPayload = deserialized.payload as TokenTransferPayload;
  expect(deserializedPayload.recipient).toEqual(recipientCV);
  expect(deserializedPayload.amount.toNumber()).toBe(amount.toNumber());
});
