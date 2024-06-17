import {
  createSTXPostCondition,
  createFungiblePostCondition,
  createNonFungiblePostCondition,
} from '../src/postcondition';

import {
  STXPostCondition,
  FungiblePostCondition,
  NonFungiblePostCondition,
  createAsset,
  createStandardPrincipal,
  createContractPrincipal,
  ContractPrincipal,
} from '../src/postcondition-types';
import { addressToString } from '../src/common';

import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  StacksWireType,
  PostConditionPrincipalId,
} from '../src/constants';

import { serializeDeserialize } from './macros';

import { bufferCVFromString, BufferCV } from '../src/clarity';
import { bytesToUtf8 } from '@stacks/common';

test('STX post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.STX;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const sp = createStandardPrincipal(address);

  const conditionCode = FungibleConditionCode.GreaterEqual;
  const amount = 1000000;

  const postCondition = createSTXPostCondition(sp, conditionCode, amount);

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as STXPostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Standard);
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
  const info = createAsset(assetAddress, assetContractName, assetName);

  const postCondition = createFungiblePostCondition(principal, conditionCode, amount, info);

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as FungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Standard);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(deserialized.amount.toString()).toBe(amount.toString());
  expect(addressToString(deserialized.asset.address)).toBe(assetAddress);
  expect(deserialized.asset.contractName.content).toBe(assetContractName);
  expect(deserialized.asset.assetName.content).toBe(assetName);
});

test('Non-fungible post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.NonFungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const contractName = 'contract-name';
  const principal = createContractPrincipal(address, contractName);

  const conditionCode = NonFungibleConditionCode.DoesNotSend;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';
  const info = createAsset(assetAddress, assetContractName, assetName);

  const nftAssetName = 'nft_asset_name';

  const postCondition = createNonFungiblePostCondition(
    principal,
    conditionCode,
    info,
    bufferCVFromString(nftAssetName)
  );

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as NonFungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipal).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.asset.address)).toBe(assetAddress);
  expect(deserialized.asset.contractName.content).toBe(assetContractName);
  expect(deserialized.asset.assetName.content).toBe(assetName);
  expect(bytesToUtf8((deserialized.assetName as BufferCV).buffer)).toEqual(nftAssetName);
});

test('Non-fungible post condition with string IDs serialization and deserialization', () => {
  const postConditionType = PostConditionType.NonFungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';
  const contractName = 'contract-name';

  const conditionCode = NonFungibleConditionCode.DoesNotSend;

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
    StacksWireType.PostCondition
  ) as NonFungiblePostCondition;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipal).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.asset.address)).toBe(assetAddress);
  expect(deserialized.asset.contractName.content).toBe(assetContractName);
  expect(deserialized.asset.assetName.content).toBe(assetName);
  expect(bytesToUtf8((deserialized.assetName as BufferCV).buffer)).toEqual(nftAssetName);
});
