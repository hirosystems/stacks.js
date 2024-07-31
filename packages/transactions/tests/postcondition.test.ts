import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionPrincipalId,
} from '../src/constants';
import { serializeDeserialize } from './macros';
import { bufferCVFromString, BufferCV } from '../src/clarity';
import { bytesToUtf8, hexToBytes } from '@stacks/common';
import { postConditionToWire } from '../src/postcondition';
import {
  ContractPrincipalWire,
  FungiblePostConditionWire,
  NonFungiblePostConditionWire,
  STXPostConditionWire,
  StacksWireType,
  addressToString,
} from '../src';

test('STX post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.STX;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';

  const conditionCode = FungibleConditionCode.GreaterEqual;
  const amount = 1000000;

  const postCondition = postConditionToWire({
    type: 'stx-postcondition',
    address,
    condition: 'gte',
    amount,
  });

  const deserialized: STXPostConditionWire = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  );
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Standard);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(deserialized.amount.toString()).toBe(amount.toString());
});

test('Fungible post condition serialization and deserialization', () => {
  const postConditionType = PostConditionType.Fungible;

  const address = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';

  const conditionCode = FungibleConditionCode.GreaterEqual;
  const amount = 1000000;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';

  const postCondition = postConditionToWire({
    type: 'ft-postcondition',
    address,
    condition: 'gte',
    amount,
    asset: `${assetAddress}.${assetContractName}::${assetName}`,
  });

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as FungiblePostConditionWire;
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

  const conditionCode = NonFungibleConditionCode.DoesNotSend;

  const assetAddress = 'SP2ZP4GJDZJ1FDHTQ963F0292PE9J9752TZJ68F21';
  const assetContractName = 'contract_name';
  const assetName = 'asset_name';

  const nftAssetName = 'nft_asset_name';

  const postCondition = postConditionToWire({
    type: 'nft-postcondition',
    address: `${address}.${contractName}`,
    condition: 'not-sent',
    asset: `${assetAddress}.${assetContractName}::${assetName}`,
    assetId: bufferCVFromString(nftAssetName),
  });

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as NonFungiblePostConditionWire;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipalWire).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.asset.address)).toBe(assetAddress);
  expect(deserialized.asset.contractName.content).toBe(assetContractName);
  expect(deserialized.asset.assetName.content).toBe(assetName);
  expect(bytesToUtf8(hexToBytes((deserialized.assetName as BufferCV).value))).toEqual(nftAssetName);
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

  const postCondition = postConditionToWire({
    type: 'nft-postcondition',
    address: `${address}.${contractName}`,
    condition: 'not-sent',
    asset: `${assetAddress}.${assetContractName}::${assetName}`,
    assetId: bufferCVFromString(nftAssetName),
  });

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as NonFungiblePostConditionWire;
  expect(deserialized.conditionType).toBe(postConditionType);
  expect(deserialized.principal.prefix).toBe(PostConditionPrincipalId.Contract);
  expect(addressToString(deserialized.principal.address)).toBe(address);
  expect((deserialized.principal as ContractPrincipalWire).contractName.content).toBe(contractName);
  expect(deserialized.conditionCode).toBe(conditionCode);
  expect(addressToString(deserialized.asset.address)).toBe(assetAddress);
  expect(deserialized.asset.contractName.content).toBe(assetContractName);
  expect(deserialized.asset.assetName.content).toBe(assetName);
  expect(bytesToUtf8(hexToBytes((deserialized.assetName as BufferCV).value))).toEqual(nftAssetName);
});
