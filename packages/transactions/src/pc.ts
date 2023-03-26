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
 * @internal
 */
type AddressString = string;

/**
 * A contract identifier string given as `<address>.<contract-name>`
 * @internal
 */
type ContractIdString = `${string}.${string}`;

/**
 * An asset identifier string given as `<contract-id>::<token-name>` aka `<contract-address>.<contract-name>::<token-name>`
 * @internal
 */
type NftString = `${ContractIdString}::${string}`;

/**
 * ### `Pc.` Post Condition Builder
 * @param {AddressString | ContractIdString} principal The principal to check, which should/should-not be sending assets. A string in the format "address" or "address.contractId".
 * @returns A partial post condition builder, which can be chained into a final post condition.
 * @example
 * ```
 * import { Pc } from '@stacks/transactions';
 * Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendEq(100).stx();
 * ```
 */
export function principal(principal: AddressString | ContractIdString) {
  if (isContractIdString(principal)) {
    // `principal` is a ContractIdString here
    const [address, name] = parseContractId(principal);
    return new PartialPcWithPrincipal(address, name);
  }

  return new PartialPcWithPrincipal(principal, undefined);
}

class PartialPcWithPrincipal {
  constructor(private address: string, private contractName?: string) {}

  // todo: split FT and STX into separate methods? e.g. `willSendSTXEq` and `willSendFtEq`

  /**
   * ### Fungible Token Post Condition
   * A post-condition sending `FungibleConditionCode.Equal` uSTX or other fungible tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
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
   * A post-condition sending `FungibleConditionCode.LessEqual` uSTX or other fungible tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
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
   * A post-condition sending `FungibleConditionCode.Less` uSTX or other fungible tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
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
   * A post-condition sending `FungibleConditionCode.GreaterEqual` uSTX or other fungible tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
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
   * A post-condition sending `FungibleConditionCode.Greater` uSTX or other fungible tokens.
   * Finalize with the chained `.ustx()` or `.ft(…)` method.
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
   */
  willNotSendAsset() {
    return new PartialPcNftWithCode(
      this.address,
      NonFungibleConditionCode.DoesNotSend,
      this.contractName
    );
  }
}

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

function parseContractId(contractId: ContractIdString) {
  const [address, name] = contractId.split('.');
  if (!address || !name) throw new Error(`Invalid contract identifier: ${contractId}`);
  return [address, name];
}

function parseNft(nftAssetName: NftString) {
  const [principal, tokenName] = nftAssetName.split('::') as [ContractIdString, string];
  if (!principal || !tokenName)
    throw new Error(`Invalid fully-qualified nft asset name: ${nftAssetName}`);
  const [address, name] = parseContractId(principal);
  return { contractAddress: address, contractName: name, tokenName };
}

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
