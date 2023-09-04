import { IntegerType } from '@stacks/common';
import {
  makeContractFungiblePostCondition,
  makeContractNonFungiblePostCondition,
  makeContractSTXPostCondition,
  makeStandardFungiblePostCondition,
  makeStandardNonFungiblePostCondition,
  makeStandardSTXPostCondition,
} from './builders';
import { ClarityValue } from './clarity';
import { FungibleConditionCode, NonFungibleConditionCode } from './constants';
import { createAssetInfo, NonFungiblePostCondition } from './postcondition-types';

/// `Pc.` Post Condition Builder
//
// This is a behavioral helper interface for constructing post conditions.
//
// The general pattern is:
//   PRINCIPAL -> [AMOUNT] -> CODE -> ASSET
//

/**
 * An address string encoded as c32check
 */
type AddressString = string;

/**
 * A contract identifier string given as `<address>.<contract-name>`
 */
type ContractIdString = `${string}.${string}`;

/**
 * An asset identifier string given as `<contract-id>::<token-name>` aka `<contract-address>.<contract-name>::<token-name>`
 */
type NftString = `${ContractIdString}::${string}`;

/**
 * ### `Pc.` Post Condition Builder
 * @beta Interface may be subject to change in future releases.
 * @param {AddressString | ContractIdString} principal The principal to check, which should/should-not be sending assets. A string in the format "address" or "address.contractId".
 * @returns A partial post condition builder, which can be chained into a final post condition.
 * @example
 * ```
 * import { Pc } from '@stacks/transactions';
 * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendEq(10000).ustx();
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function principal(principal: AddressString | ContractIdString) {
  if (isContractIdString(principal)) {
    // `principal` is a ContractIdString here
    const [address, name] = parseContractId(principal);
    return new PartialPcWithPrincipal(address, name);
  }

  return new PartialPcWithPrincipal(principal, undefined);
}

/**
 * Not meant to be used directly. Start from `Pc.principal(…)` instead.
 */
class PartialPcWithPrincipal {
  constructor(
    private address: string,
    private contractName?: string
  ) {}

  // todo: split FT and STX into separate methods? e.g. `willSendSTXEq` and `willSendFtEq`

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending tokens `FungibleConditionCode.Equal` (equal to) the given amount of uSTX or fungible-tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendEq(100).stx();
   * ```
   */
  willSendEq(amount: IntegerType) {
    return new PartialPcFtWithCode(
      this.address,
      amount,
      FungibleConditionCode.Equal,
      this.contractName
    );
  }

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending tokens `FungibleConditionCode.LessEqual` (less-than or equal to) the given amount of uSTX or fungible-tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendLte(100).stx();
   * ```
   */
  willSendLte(amount: IntegerType) {
    return new PartialPcFtWithCode(
      this.address,
      amount,
      FungibleConditionCode.LessEqual,
      this.contractName
    );
  }

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending tokens `FungibleConditionCode.Less` (less-than) the given amount of uSTX or fungible-tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendLt(100).stx();
   * ```
   */
  willSendLt(amount: IntegerType) {
    return new PartialPcFtWithCode(
      this.address,
      amount,
      FungibleConditionCode.Less,
      this.contractName
    );
  }

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending tokens `FungibleConditionCode.GreaterEqual` (greater-than or equal to) the given amount of uSTX or fungible-tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendGte(100).stx();
   * ```
   */
  willSendGte(amount: IntegerType) {
    return new PartialPcFtWithCode(
      this.address,
      amount,
      FungibleConditionCode.GreaterEqual,
      this.contractName
    );
  }

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending tokens `FungibleConditionCode.Greater` (greater-than) the given amount of uSTX or fungible-tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendGt(100).stx();
   * ```
   */
  willSendGt(amount: IntegerType) {
    return new PartialPcFtWithCode(
      this.address,
      amount,
      FungibleConditionCode.Greater,
      this.contractName
    );
  }

  /**
   * ### NFT Post Condition
   * A post-condition which `NonFungibleConditionCode.Sends` an NFT.
   * Finalize with the chained `.nft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB4…K6.nft-contract').willSendAsset().nft('STB4…K6.super-nft::super', uintCV(1));
   * ```
   */
  willSendAsset() {
    return new PartialPcNftWithCode(
      this.address,
      NonFungibleConditionCode.Sends,
      this.contractName
    );
  }

  /**
   * ### NFT Post Condition
   * A post-condition which `NonFungibleConditionCode.DoesNotSend` an NFT.
   * Finalize with the chained `.nft(…)` method.
   * @example
   * ```
   * import { Pc } from '@stacks/transactions';
   * Pc.principal('STB4…K6.nft-contract').willNotSendAsset().nft('STB4…K6.super-nft::super', uintCV(1));
   * ```
   */
  willNotSendAsset() {
    return new PartialPcNftWithCode(
      this.address,
      NonFungibleConditionCode.DoesNotSend,
      this.contractName
    );
  }
}

/**
 * Not meant to be used directly. Start from `Pc.principal(…)` instead.
 */
class PartialPcFtWithCode {
  constructor(
    private address: string,
    private amount: IntegerType,
    private code: FungibleConditionCode,
    private contractName?: string
  ) {}

  /**
   * ### STX Post Condition
   * ⚠ Amount of STX is denoted in uSTX (micro-STX)
   */
  ustx() {
    // todo: rename to `uSTX`?
    if (this.contractName) {
      return makeContractSTXPostCondition(this.address, this.contractName, this.code, this.amount);
    }
    return makeStandardSTXPostCondition(this.address, this.code, this.amount);
  }

  /**
   * ### Fungible Token Post Condition
   * ⚠ Amount of fungible tokens is denoted in the smallest unit of the token
   */
  ft(contractId: ContractIdString, tokenName: string) {
    const [address, name] = parseContractId(contractId);
    if (this.contractName) {
      return makeContractFungiblePostCondition(
        this.address,
        this.contractName,
        this.code,
        this.amount,
        createAssetInfo(address, name, tokenName)
      );
    }
    return makeStandardFungiblePostCondition(
      this.address,
      this.code,
      this.amount,
      createAssetInfo(address, name, tokenName)
    );
  }
}

/**
 * Not meant to be used directly. Start from `Pc.principal(…)` instead.
 */
class PartialPcNftWithCode {
  constructor(
    private principal: string,
    private code: NonFungibleConditionCode,
    private contractName?: string
  ) {}

  /**
   * ### Non-Fungible Token Post Condition
   * @param assetName - The name of the NFT asset. Formatted as `<contract-address>.<contract-name>::<token-name>`.
   * @param assetId - The asset identifier of the NFT. A Clarity value defining the single NFT instance.
   */
  nft(assetName: NftString, assetId: ClarityValue): NonFungiblePostCondition;
  /**
   * ### Non-Fungible Token Post Condition
   * @param contractId - The contract identifier of the NFT. Formatted as `<contract-address>.<contract-name>`.
   * @param tokenName - The name of the NFT asset.
   * @param assetId - The asset identifier of the NFT. A Clarity value defining the single NFT instance.
   */
  nft(
    contractId: ContractIdString,
    tokenName: string,
    assetId: ClarityValue
  ): NonFungiblePostCondition;
  nft(...args: [any, any] | [any, any, any]): NonFungiblePostCondition {
    const { contractAddress, contractName, tokenName, assetId } = getNftArgs(
      ...(args as [any, any, any])
    );

    if (this.contractName) {
      return makeContractNonFungiblePostCondition(
        this.principal,
        this.contractName,
        this.code,
        createAssetInfo(contractAddress, contractName, tokenName),
        assetId
      );
    }

    return makeStandardNonFungiblePostCondition(
      this.principal,
      this.code,
      createAssetInfo(contractAddress, contractName, tokenName),
      assetId
    );
  }
}

/** @internal */
function parseContractId(contractId: ContractIdString) {
  const [address, name] = contractId.split('.');
  if (!address || !name) throw new Error(`Invalid contract identifier: ${contractId}`);
  return [address, name];
}

/** @internal */
function parseNft(nftAssetName: NftString) {
  const [principal, tokenName] = nftAssetName.split('::') as [ContractIdString, string];
  if (!principal || !tokenName)
    throw new Error(`Invalid fully-qualified nft asset name: ${nftAssetName}`);
  const [address, name] = parseContractId(principal);
  return { contractAddress: address, contractName: name, tokenName };
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function isContractIdString(value: AddressString | ContractIdString): value is ContractIdString {
  return value.includes('.');
}

/**
 * Helper method for `PartialPcNftWithCode.nft` to parse the arguments.
 * @internal
 */
function getNftArgs(
  assetName: NftString,
  assetId: ClarityValue
): { contractAddress: string; contractName: string; tokenName: string; assetId: ClarityValue };
function getNftArgs(
  contractId: ContractIdString,
  tokenName: string,
  assetId: ClarityValue
): { contractAddress: string; contractName: string; tokenName: string; assetId: ClarityValue };
function getNftArgs(...args: [any, any] | [any, any, any]): {
  contractAddress: string;
  contractName: string;
  tokenName: string;
  assetId: ClarityValue;
} {
  if (args.length === 2) {
    const [assetName, assetId] = args;
    return { ...parseNft(assetName), assetId };
  }

  // args.length === 3
  const [contractId, tokenName, assetId] = args;
  const [address, name] = parseContractId(contractId);
  return { contractAddress: address, contractName: name, tokenName, assetId };
}
