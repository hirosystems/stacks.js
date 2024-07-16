import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionPrincipalId,
} from '../src/constants';
import { serializeDeserialize } from './macros';
import { bufferCVFromString, BufferCV } from '../src/clarity';
import { bytesToUtf8, hexToBytes } from '@stacks/common';
import { postConditionToHex, postConditionToWire } from '../src/postcondition';
import {
  Cl,
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

  const deserialized = serializeDeserialize(
    postCondition,
    StacksWireType.PostCondition
  ) as STXPostConditionWire;
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

describe(postConditionToHex.name, () => {
  const TEST_CASES = [
    {
      repr: {
        type: 'stx-postcondition',
        address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        condition: 'eq',
        amount: 100_000,
      } as const,
      expected: '00021a164247d6f2b425ac5771423ae6c80c754f7172b00100000000000186a0',
    },
    {
      repr: {
        type: 'ft-postcondition',
        address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.other',
        condition: 'eq',
        amount: 100_000,
        asset: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.token::tok',
      } as const,
      expected:
        '01031a164247d6f2b425ac5771423ae6c80c754f7172b0056f746865721a164247d6f2b425ac5771423ae6c80c754f7172b005746f6b656e03746f6b0100000000000186a0',
    },
    {
      repr: {
        type: 'nft-postcondition',
        address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        condition: 'not-sent',
        asset: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6.token::tok',
        assetId: Cl.uint(32),
      } as const,
      expected:
        '02021a164247d6f2b425ac5771423ae6c80c754f7172b01a164247d6f2b425ac5771423ae6c80c754f7172b005746f6b656e03746f6b010000000000000000000000000000002011',
    },
  ];

  test.each(TEST_CASES)('postConditionToHex %p', ({ repr, expected }) => {
    const hex = postConditionToHex(repr);
    expect(hex).toBe(expected);
  });
});
