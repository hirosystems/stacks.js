import {
  createSTXPostCondition,
  createFungiblePostCondition,
  createNonFungiblePostCondition,
} from '../src/postcondition';

import {
  STXPostCondition,
  FungiblePostCondition,
  NonFungiblePostCondition,
  createAssetInfo,
  createStandardPrincipal,
  createContractPrincipal,
  ContractPrincipal,
} from '../src/postcondition-types';
import { addressToString } from '../src/common';

import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  StacksMessageType,
  PostConditionPrincipalID,
} from '../src/constants';

import { serializeDeserialize } from './macros';

import { bufferCVFromString, BufferCV } from '../src/clarity';

test('STX post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.STX;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const sp = createStandardPrincipal(address);

  const conditionCode = FungibleConditionCode.GreaterEqual;
  const amount = 1000000;

  const postCondition = createSTXPostCondition(sp, conditionCode, amount);

  const deserialized = serializeDeserialize(
    postCondition,
    StacksMessageType.PostCondition
  ) as STXPostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalID.Standard);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('Fungible post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.Fungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const principal = createStandardPrincipal(address);

  const conditionCode = FungibleConditionCode.GreaterEqual;
  const amount = 1000000;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';
  const info = createAssetInfo(assetAddress, assetContractName, assetName);

  const postCondition = createFungiblePostCondition(principal, conditionCode, amount, info);

  const deserialized = serializeDeserialize(
    postCondition,
    StacksMessageType.PostCondition
  ) as FungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalID.Standard);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(deserialized.amount.toString()).toBe(amount.toString());
  expect(addressToString(deserialized.assetInfo.address)).toBe(assetAddress);
  expect(deserialized.assetInfo.contractName.content).toBe(assetContractName);
  expect(deserialized.assetInfo.assetName.content).toBe(assetName);
});

test('Non-fungible post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.NonFungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const contractName = 'contract-name';
  const principal = createContractPrincipal(address, contractName);

  const conditionCode = NonFungibleConditionCode.Owns;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';
  const info = createAssetInfo(assetAddress, assetContractName, assetName);

  const nftAssetName = 'nft_asset_name';

  const postCondition = createNonFungiblePostCondition(
    principal,
    conditionCode,
    info,
    bufferCVFromString(nftAssetName)
  );

  const deserialized = serializeDeserialize(
    postCondition,
    StacksMessageType.PostCondition
  ) as NonFungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalID.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipal).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.assetInfo.address)).toBe(assetAddress);
  expect(deserialized.assetInfo.contractName.content).toBe(assetContractName);
  expect(deserialized.assetInfo.assetName.content).toBe(assetName);
  expect((deserialized.assetName as BufferCV).buffer.toString()).toEqual(nftAssetName);
});

test('Non-fungible post condition with string IDs serialization and deserialization', () => {
  const postConditionType = PostConditionType.NonFungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const contractName = 'contract-name';

  const conditionCode = NonFungibleConditionCode.Owns;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';

  const nftAssetName = 'nft_asset_name';

  const postCondition = createNonFungiblePostCondition(
    `${address}.${contractName}`,
    conditionCode,
    `${assetAddress}.${assetContractName}::${assetName}`,
    bufferCVFromString(nftAssetName)
  );

  const deserialized = serializeDeserialize(
    postCondition,
    StacksMessageType.PostCondition
  ) as NonFungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalID.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipal).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.assetInfo.address)).toBe(assetAddress);
  expect(deserialized.assetInfo.contractName.content).toBe(assetContractName);
  expect(deserialized.assetInfo.assetName.content).toBe(assetName);
  expect((deserialized.assetName as BufferCV).buffer.toString()).toEqual(nftAssetName);
});
