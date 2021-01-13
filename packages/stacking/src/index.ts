// import axios from 'axios';
// import { BigNumber } from 'bignumber.js';
import {
  makeContractCall,
  bufferCV,
  uintCV,
  tupleCV,
  ClarityType,
  broadcastTransaction,
  standardPrincipalCV,
  ContractCallOptions,
  UIntCV,
  BufferCV,
  ContractCallPayload,
  StacksTransaction,
  callReadOnlyFunction,
  cvToString,
  ClarityValue,
  ResponseErrorCV,
  SomeCV,
  TupleCV,
  noneCV,
  someCV,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import BN from 'bn.js';
import { StackingErrors } from './constants';
import { fetchPrivate } from '@stacks/common';
import { decodeBtcAddress } from './utils';

export interface PoxInfo {
  contract_id: string;
  first_burnchain_block_height: number;
  min_amount_ustx: string;
  registration_window_length: 250;
  rejection_fraction: number;
  reward_cycle_id: number;
  reward_cycle_length: number;
  rejection_votes_left_required: number;
}

export type StackerInfo =
  | {
      stacked: false;
    }
  | {
      stacked: true;
      details: {
        amount_microstx: string;
        first_reward_cycle: number;
        lock_period: number;
        unlock_height: number;
        pox_address: {
          version: Buffer;
          hashbytes: Buffer;
        };
      };
    };

export interface BlockTimeInfo {
  mainnet: {
    target_block_time: number;
  };
  testnet: {
    target_block_time: number;
  };
}

export interface CoreInfo {
  burn_block_height: number;
  stable_pox_consensus: string;
}

export interface BalanceInfo {
  balance: string;
  nonce: number;
}

export interface StackingEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Lock stx check options
 *
 * @param  {String} poxAddress - the reward Bitcoin address
 * @param  {number} cycles - number of cycles to lock
 */
export interface CanLockStxOptions {
  poxAddress: string;
  cycles: number;
}

/**
 * Lock stx options
 *
 * @param  {String} key - private key to sign transaction
 * @param  {String} poxAddress - the reward Bitcoin address
 * @param  {number} cycles - number of cycles to lock
 * @param  {BigNum} amountMicroStx - number of microstacks to lock
 * @param  {number} burnBlockHeight - the burnchain block height to begin lock
 */
export interface LockStxOptions {
  privateKey: string;
  cycles: number;
  poxAddress: string;
  amountMicroStx: BN;
  burnBlockHeight: number;
}

/**
 * Delegate stx options
 *
 * @param  {BigNum} amountMicroStx - number of microstacks to delegate
 * @param  {String} delegateTo - the STX address of the delegatee
 * @param  {number} untilBurnBlockHeight - the burnchain block height after which delegation is revoked
 * @param  {String} poxAddress - the reward Bitcoin address of the delegator
 * @param  {String} privateKey - private key to sign transaction
 */
export interface DelegateStxOptions {
  amountMicroStx: BN;
  delegateTo: string;
  untilBurnBlockHeight?: number;
  poxAddress?: string;
  privateKey: string;
}

/**
 * Delegate stack stx options
 *
 * @param  {String} stacker - the STX address of the delegator
 * @param  {BigNum} amountMicroStx - number of microstacks to lock
 * @param  {String} poxAddress - the reward Bitcoin address
 * @param  {number} burnBlockHeight - the burnchain block height to begin lock
 * @param  {number} cycles - number of cycles to lock
 * @param  {String} privateKey - private key to sign transaction
 */
export interface DelegateStackStxOptions {
  stacker: string;
  amountMicroStx: BN;
  poxAddress: string;
  burnBlockHeight: number;
  cycles: number;
  privateKey: string;
  nonce?: BN;
}

export interface StackAggregationCommitOptions {
  poxAddress: string;
  rewardCycle: number;
  privateKey: string;
}

export class StackingClient {
  constructor(public address: string, public network: StacksNetwork) {}

  /**
   * Get stacks node info
   *
   * @returns {Promise<CoreInfo>} that resolves to a CoreInfo response if the operation succeeds
   */
  async getCoreInfo(): Promise<CoreInfo> {
    const url = this.network.getInfoUrl();
    return fetchPrivate(url).then(res => res.json());
  }

  /**
   * Get stacks node pox info
   *
   * @returns {Promise<PoxInfo>} that resolves to a PoxInfo response if the operation succeeds
   */
  async getPoxInfo(): Promise<PoxInfo> {
    const url = this.network.getPoxInfoUrl();
    return fetchPrivate(url).then(res => res.json());
  }

  /**
   * Get stacks node target block time
   *
   * @returns {Promise<number>} that resolves to a number if the operation succeeds
   */
  async getTargetBlockTime(): Promise<number> {
    const url = this.network.getBlockTimeInfoUrl();
    const res = await fetchPrivate(url).then(res => res.json());

    if (this.network.isMainnet()) {
      return res.mainnet.target_block_time;
    } else {
      return res.testnet.target_block_time;
    }
  }

  async getAccountStatus(): Promise<any> {
    const url = this.network.getAccountApiUrl(this.address);
    return fetchPrivate(url).then(res => res.json());
  }

  /**
   * Get account balance
   *
   * @returns {Promise<BN>} that resolves to a BigNum if the operation succeeds
   */
  async getAccountBalance(): Promise<BN> {
    return this.getAccountStatus().then(res => {
      let balanceHex = res.balance;
      if (res.balance.startsWith('0x')) {
        balanceHex = res.balance.substr(2);
      }
      return new BN(balanceHex, 'hex');
    });
  }

  /**
   * Get reward cycle duration in seconds
   *
   * @returns {Promise<number>} that resolves to a number if the operation succeeds
   */
  async getCycleDuration(): Promise<number> {
    const poxInfoPromise = this.getPoxInfo();
    const targetBlockTimePromise = await this.getTargetBlockTime();

    return Promise.all([poxInfoPromise, targetBlockTimePromise]).then(
      ([poxInfo, targetBlockTime]) => {
        return poxInfo.reward_cycle_length * targetBlockTime;
      }
    );
  }

  /**
   * Get number of seconds until next reward cycle
   *
   * @returns {Promise<number>} that resolves to a number if the operation succeeds
   */
  async getSecondsUntilNextCycle(): Promise<number> {
    const poxInfoPromise = this.getPoxInfo();
    const targetBlockTimePromise = await this.getTargetBlockTime();
    const coreInfoPromise = this.getCoreInfo();

    return Promise.all([poxInfoPromise, targetBlockTimePromise, coreInfoPromise]).then(
      ([poxInfo, targetBlockTime, coreInfo]) => {
        const blocksToNextCycle =
          poxInfo.reward_cycle_length -
          ((coreInfo.burn_block_height - poxInfo.first_burnchain_block_height) %
            poxInfo.reward_cycle_length);
        const cycleDuration = poxInfo.reward_cycle_length * targetBlockTime;
        return blocksToNextCycle * cycleDuration;
      }
    );
  }

  /**
   * Check if stacking is enabled for next reward cycle
   *
   * @returns {Promise<boolean>} that resolves to a bool if the operation succeeds
   */
  async isStackingEnabledNextCycle(): Promise<boolean> {
    return (await this.getPoxInfo()).rejection_votes_left_required > 0;
  }

  /**
   * Check if account has minimum require amount of Stacks for stacking
   *
   * @returns {Promise<boolean>} that resolves to a bool if the operation succeeds
   */
  async hasMinimumStx(): Promise<boolean> {
    const balance: BN = await this.getAccountBalance();
    const min: BN = new BN((await this.getPoxInfo()).min_amount_ustx.toString());
    return balance.gte(min);
  }

  /**
   * Check if account can lock stx
   *
   * @param {CanLockStxOptions} options - a required lock STX options object
   *
   * @returns {Promise<StackingEligibility>} that resolves to a StackingEligibility object if the operation succeeds
   */
  async canStack({ poxAddress, cycles }: CanLockStxOptions): Promise<StackingEligibility> {
    const balancePromise: Promise<BN> = this.getAccountBalance();
    const poxInfoPromise = this.getPoxInfo();

    return Promise.all([balancePromise, poxInfoPromise])
      .then(([balance, poxInfo]) => {
        const { hashMode, data } = decodeBtcAddress(poxAddress);
        const hashModeBuffer = bufferCV(new BN(hashMode, 10).toArrayLike(Buffer));
        const hashbytes = bufferCV(data);
        const poxAddressCV = tupleCV({
          hashbytes,
          version: hashModeBuffer,
        });

        const [contractAddress, contractName] = poxInfo.contract_id.split('.');

        return callReadOnlyFunction({
          network: this.network,
          contractName,
          contractAddress,
          functionName: 'can-stack-stx',
          senderAddress: this.address,
          functionArgs: [
            poxAddressCV,
            uintCV(balance.toString()),
            uintCV(poxInfo.reward_cycle_id),
            uintCV(cycles.toString()),
          ],
        });
      })
      .then((responseCV: ClarityValue) => {
        if (responseCV.type === ClarityType.ResponseOk) {
          return {
            eligible: true,
          };
        } else {
          const errorCV = responseCV as ResponseErrorCV;
          return {
            eligible: false,
            reason: StackingErrors[+cvToString(errorCV.value)],
          };
        }
      });
  }

  /**
   * Generate and broadcast a stacking transaction to lock STX
   *
   * @param {LockStxOptions} options - a required lock STX options object
   *
   * @returns {Promise<string>} that resolves to a broadcasted txid if the operation succeeds
   */
  async stack({ amountMicroStx, poxAddress, cycles, privateKey, burnBlockHeight }: LockStxOptions) {
    const poxInfo = await this.getPoxInfo();
    const contract = poxInfo.contract_id;

    const txOptions = this.getStackOptions({
      amountMicroStx,
      cycles,
      poxAddress,
      contract,
      burnBlockHeight,
    });
    const tx = await makeContractCall({
      ...txOptions,
      senderKey: privateKey,
    });

    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  /**
   * As a delegatee, generate and broadcast a transaction to create a delegation relationship
   *
   * @param {DelegateStxOptions} options - a required delegate STX options object
   *
   * @returns {Promise<string>} that resolves to a broadcasted txid if the operation succeeds
   */
  async delegateStx({
    amountMicroStx,
    delegateTo,
    untilBurnBlockHeight,
    poxAddress,
    privateKey,
  }: DelegateStxOptions) {
    const poxInfo = await this.getPoxInfo();
    const contract = poxInfo.contract_id;

    const txOptions = this.getDelegateOptions({
      contract,
      amountMicroStx,
      delegateTo,
      untilBurnBlockHeight,
      poxAddress,
    });
    const tx = await makeContractCall({
      ...txOptions,
      senderKey: privateKey,
    });

    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  /**
   * As a delegator, generate and broadcast transactions to stack for multiple delegatees. This will lock up tokens owned by the delegatees.
   *
   * @param {DelegateStackStxOptions} options - a required delegate stack STX options object
   *
   * @returns {Promise<string>} that resolves to a broadcasted txid if the operation succeeds
   */
  async delegateStackStx({
    stacker,
    amountMicroStx,
    poxAddress,
    burnBlockHeight,
    cycles,
    privateKey,
    nonce,
  }: DelegateStackStxOptions) {
    const poxInfo = await this.getPoxInfo();
    const contract = poxInfo.contract_id;

    const txOptions = this.getDelegateStackOptions({
      contract,
      stacker,
      amountMicroStx,
      poxAddress,
      burnBlockHeight,
      cycles,
      nonce,
    });
    const tx = await makeContractCall({
      ...txOptions,
      senderKey: privateKey,
    });

    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  /**
   * As a delegator, generate and broadcast a transaction to commit partially committed delegatee tokens
   *
   * @param {StackAggregationCommitOptions} options - a required stack aggregation commit options object
   *
   * @returns {Promise<string>} that resolves to a broadcasted txid if the operation succeeds
   */
  async stackAggregationCommit({
    poxAddress,
    rewardCycle,
    privateKey,
  }: StackAggregationCommitOptions) {
    const poxInfo = await this.getPoxInfo();
    const contract = poxInfo.contract_id;

    const txOptions = this.getStackAggregationCommitOptions({
      contract,
      poxAddress,
      rewardCycle,
    });
    const tx = await makeContractCall({
      ...txOptions,
      senderKey: privateKey,
    });

    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  /**
   * As a delegatee, generate and broadcast a transaction to terminate the delegation relationship
   *
   * @param {string} privateKey - the private key to be used for the revoke call
   *
   * @returns {Promise<string>} that resolves to a broadcasted txid if the operation succeeds
   */
  async revokeDelegateStx(privateKey: string) {
    const poxInfo = await this.getPoxInfo();
    const contract = poxInfo.contract_id;

    const txOptions = this.getRevokeDelegateStxOptions(contract);

    const tx = await makeContractCall({
      ...txOptions,
      senderKey: privateKey,
    });

    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  getStackOptions({
    amountMicroStx,
    poxAddress,
    cycles,
    contract,
    burnBlockHeight,
  }: {
    cycles: number;
    poxAddress: string;
    amountMicroStx: BN;
    contract: string;
    burnBlockHeight: number;
  }) {
    const { hashMode, data } = decodeBtcAddress(poxAddress);
    const hashModeBuffer = bufferCV(new BN(hashMode, 10).toArrayLike(Buffer));
    const hashbytes = bufferCV(data);
    const address = tupleCV({
      hashbytes,
      version: hashModeBuffer,
    });
    const [contractAddress, contractName] = contract.split('.');
    const network = this.network;
    const txOptions: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: 'stack-stx',
      // sum of uStx, address, burn_block_height, num_cycles
      functionArgs: [
        uintCV(amountMicroStx.toString(10)),
        address,
        uintCV(burnBlockHeight),
        uintCV(cycles),
      ],
      validateWithAbi: true,
      network,
    };
    return txOptions;
  }

  getDelegateOptions({
    contract,
    amountMicroStx,
    delegateTo,
    untilBurnBlockHeight,
    poxAddress,
  }: {
    contract: string;
    amountMicroStx: BN;
    delegateTo: string;
    untilBurnBlockHeight?: number;
    poxAddress?: string;
  }) {
    let address = undefined;

    if (poxAddress) {
      const { hashMode, data } = decodeBtcAddress(poxAddress);
      const hashModeBuffer = bufferCV(new BN(hashMode, 10).toBuffer());
      const hashbytes = bufferCV(data);
      address = someCV(
        tupleCV({
          hashbytes,
          version: hashModeBuffer,
        })
      );
    }

    const [contractAddress, contractName] = contract.split('.');
    const network = this.network;
    const txOptions: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: 'delegate-stx',
      functionArgs: [
        uintCV(amountMicroStx.toString(10)),
        standardPrincipalCV(delegateTo),
        untilBurnBlockHeight ? uintCV(untilBurnBlockHeight) : noneCV(),
        address ? address : noneCV(),
      ],
      validateWithAbi: true,
      network,
    };
    return txOptions;
  }

  getDelegateStackOptions({
    contract,
    stacker,
    amountMicroStx,
    poxAddress,
    burnBlockHeight,
    cycles,
    nonce,
  }: {
    contract: string;
    stacker: string;
    amountMicroStx: BN;
    poxAddress: string;
    burnBlockHeight: number;
    cycles: number;
    nonce?: BN;
  }) {
    const { hashMode, data } = decodeBtcAddress(poxAddress);
    const hashModeBuffer = bufferCV(new BN(hashMode, 10).toBuffer());
    const hashbytes = bufferCV(data);
    const address = tupleCV({
      hashbytes,
      version: hashModeBuffer,
    });

    const [contractAddress, contractName] = contract.split('.');
    const network = this.network;
    const txOptions: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: 'delegate-stack-stx',
      functionArgs: [
        standardPrincipalCV(stacker),
        uintCV(amountMicroStx.toString(10)),
        address,
        uintCV(burnBlockHeight),
        uintCV(cycles),
      ],
      validateWithAbi: true,
      network,
    };

    if (nonce) {
      txOptions.nonce = nonce;
    }

    return txOptions;
  }

  getStackAggregationCommitOptions({
    contract,
    poxAddress,
    rewardCycle,
  }: {
    contract: string;
    poxAddress: string;
    rewardCycle: number;
  }) {
    const { hashMode, data } = decodeBtcAddress(poxAddress);
    const hashModeBuffer = bufferCV(new BN(hashMode, 10).toBuffer());
    const hashbytes = bufferCV(data);
    const address = tupleCV({
      hashbytes,
      version: hashModeBuffer,
    });

    const [contractAddress, contractName] = contract.split('.');
    const network = this.network;
    const txOptions: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: 'stack-aggregation-commit',
      functionArgs: [address, uintCV(rewardCycle)],
      validateWithAbi: true,
      network,
    };
    return txOptions;
  }

  getRevokeDelegateStxOptions(contract: string) {
    const [contractAddress, contractName] = contract.split('.');
    const network = this.network;
    const txOptions: ContractCallOptions = {
      contractAddress,
      contractName,
      functionName: 'revoke-delegate-stx',
      functionArgs: [],
      validateWithAbi: true,
      network,
    };
    return txOptions;
  }

  /**
   * Check stacking status
   *
   * @returns {Promise<StackerInfo>} that resolves to a StackerInfo object if the operation succeeds
   */
  async getStatus(): Promise<StackerInfo> {
    const [contractAddress, contractName] = (await this.getPoxInfo()).contract_id.split('.');
    const account = await this.getAccountStatus();
    const functionName = 'get-stacker-info';

    return callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName,
      senderAddress: this.address,
      functionArgs: [standardPrincipalCV(this.address)],
      network: this.network,
    }).then((responseCV: ClarityValue) => {
      if (responseCV.type === ClarityType.OptionalSome) {
        const someCV = responseCV as SomeCV;
        const tupleCV: TupleCV = someCV.value as TupleCV;
        const poxAddress: TupleCV = tupleCV.data['pox-addr'] as TupleCV;
        const amountMicroStx: UIntCV = tupleCV.data['amount-ustx'] as UIntCV;
        const firstRewardCycle: UIntCV = tupleCV.data['first-reward-cycle'] as UIntCV;
        const lockPeriod: UIntCV = tupleCV.data['lock-period'] as UIntCV;
        const version: BufferCV = poxAddress.data['version'] as BufferCV;
        const hashbytes: BufferCV = poxAddress.data['hashbytes'] as BufferCV;

        return {
          stacked: true,
          details: {
            amount_microstx: amountMicroStx.value.toString(),
            first_reward_cycle: firstRewardCycle.value.toNumber(),
            lock_period: lockPeriod.value.toNumber(),
            unlock_height: account.unlock_height,
            pox_address: {
              version: version.buffer,
              hashbytes: hashbytes.buffer,
            },
          },
        };
      } else if (responseCV.type === ClarityType.OptionalNone) {
        return {
          stacked: false,
        };
      } else {
        throw new Error(`Error fetching stacker info`);
      }
    });
  }

  /**
   * Adjust microstacks amount for locking after taking into account transaction fees
   *
   * @returns {StacksTransaction} that resolves to a transaction object if the operation succeeds
   */
  modifyLockTxFee({ tx, amountMicroStx }: { tx: StacksTransaction; amountMicroStx: BN }) {
    const fee = tx.auth.getFee() as BN;
    (tx.payload as ContractCallPayload).functionArgs[0] = uintCV(
      new BN(amountMicroStx.toString(10), 10).sub(fee).toBuffer()
    );
    return tx;
  }
}
