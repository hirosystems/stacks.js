import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import {
  makeContractCall,
  bufferCV,
  uintCV,
  tupleCV,
  ClarityType,
  broadcastTransaction,
  standardPrincipalCV,
  serializeCV,
  deserializeCV,
  ContractCallOptions,
  UIntCV,
  BufferCV,
  ContractCallPayload,
  StacksTransaction,
  ReadOnlyFunctionOptions,
  callReadOnlyFunction
} from '@stacks/transactions';
import {
  StacksNetwork,
  StacksMainnet
} from '@stacks/network';
import BN from 'bn.js';
import { address } from 'bitcoinjs-lib';
import { c32addressDecode } from 'c32check';

enum StackingErrors {
  ERR_STACKING_UNREACHABLE = 255,
  ERR_STACKING_INSUFFICIENT_FUNDS = 1,
  ERR_STACKING_INVALID_LOCK_PERIOD = 2,
  ERR_STACKING_ALREADY_STACKED = 3,
  ERR_STACKING_NO_SUCH_PRINCIPAL = 4,
  ERR_STACKING_EXPIRED = 5,
  ERR_STACKING_STX_LOCKED = 6,
  ERR_STACKING_PERMISSION_DENIED = 9,
  ERR_STACKING_THRESHOLD_NOT_MET = 11,
  ERR_STACKING_POX_ADDRESS_IN_USE = 12,
  ERR_STACKING_INVALID_POX_ADDRESS = 13,
  ERR_STACKING_ALREADY_REJECTED = 17,
  ERR_STACKING_INVALID_AMOUNT = 18,
  ERR_NOT_ALLOWED = 19,
  ERR_STACKING_ALREADY_DELEGATED = 20,
  ERR_DELEGATION_EXPIRES_DURING_LOCK = 21,
  ERR_DELEGATION_TOO_MUCH_LOCKED = 22,
  ERR_DELEGATION_POX_ADDR_REQUIRED = 23,
  ERR_INVALID_START_BURN_HEIGHT = 24,
}

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

export interface StackerInfo {
  amountMicroStx: string;
  firstRewardCycle: number;
  lockPeriod: number;
  poxAddr: {
    version: Buffer;
    hashbytes: Buffer;
  };
  btcAddress: string;
}

interface StackerInfoCV {
  'amount-ustx': UIntCV;
  'first-reward-cycle': UIntCV;
  'pox-addr': {
    data: {
      version: BufferCV;
      hashbytes: BufferCV;
    };
  };
  'lock-period': UIntCV;
}

export interface BlockTimeInfo {
  mainnet: {
    target_block_time: number;
  },
  testnet: {
    target_block_time: number;
  }
}

interface CoreInfo {
  burn_block_height: number;
}

interface BalanceInfo {
  balance: string;
}

export class Stacker {
  constructor(public address: string, public network: StacksNetwork = new StacksMainnet()) {
  }

  async getCoreInfo(): Promise<CoreInfo> {
    const url = this.network.getInfoUrl(); 
    const res = await axios.get<CoreInfo>(url);
    return res.data;
  }

  async getPoxInfo(): Promise<PoxInfo> {
    const url = this.network.getPoxInfoUrl(); 
    const res = await axios.get<PoxInfo>(url);
    return res.data;
  }

  async getTargetBlockTimeInfo(): Promise<number>{
    const url = this.network.getBlockTimeInfoUrl();
    const res = await axios.get<BlockTimeInfo>(url);
    if (this.network.isMainnet()) {
      return res.data.mainnet.target_block_time;
    } else {
      return res.data.testnet.target_block_time;
    }
  }

  async getStackerInfo(address: string): Promise<StackerInfo> {
    const info = await this.getPoxInfo();
    const args = [`0x${serializeCV(standardPrincipalCV(address)).toString('hex')}`];
    const [contractAddress, contractName] = info.contract_id.split('.');
    const url = this.network.getStackerInfoUrl(contractAddress, contractName);
    const body = {
      sender: 'ST384HBMC97973427QMM58NY2R9TTTN4M599XM5TD',
      arguments: args,
    };
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = response.data.result as string;

    console.log({ ...info });
    const cv = deserializeCV(Buffer.from(res.slice(2), 'hex')) as any; //TupleCV;
    console.log({ cv });
    if (!cv.value) throw new Error(`Failed to fetch stacker info. ${StackingErrors[cv.type]}`);
    const data = cv.value.data as StackerInfoCV;
    const version = data['pox-addr'].data.version.buffer;
    const hashbytes = data['pox-addr'].data.hashbytes.buffer;
    return {
      lockPeriod: data['lock-period'].value.toNumber(),
      amountMicroStx: data['amount-ustx'].value.toString(10),
      firstRewardCycle: data['first-reward-cycle'].value.toNumber(),
      poxAddr: {
        version,
        hashbytes,
      },
      btcAddress: this.getBTCAddress(version, hashbytes),
    };
  }
  
  async getAccountBalance(): Promise<BigNumber> {
    const url = this.network.getAccountApiUrl(this.address); 
    const res = await axios.get<BalanceInfo>(url);
    return new BigNumber(res.data.balance);
  }

  async blocksUntilNextCycle(): Promise<number> {
    const poxInfo = await this.getPoxInfo();
    // const targetBlockTime = await this.getTargetBlockTimeInfo();
    const coreInfo = await this.getCoreInfo();
    // const cycleDuration = poxInfo.reward_cycle_length * targetBlockTime;
    const blocksToNextCycle =
    (poxInfo.reward_cycle_length -
      ((coreInfo.burn_block_height - poxInfo.first_burnchain_block_height) %
        poxInfo.reward_cycle_length));
    return blocksToNextCycle;
  } 

  async stackingEnabledNextCycle(): Promise<boolean> {
    return (await this.getPoxInfo()).rejection_votes_left_required > 0;
  }

  async canParticipate(): Promise<boolean> {
    const balance: BigNumber = await this.getAccountBalance();
    // TODO pox info should use string type instead of number
    const min: BigNumber = new BigNumber((await this.getPoxInfo()).min_amount_ustx.toString());
    return balance.isGreaterThanOrEqualTo(min);
  }

  async canStackStx(cycles: number): Promise<boolean> {
    const balance: BigNumber = await this.getAccountBalance();
    const poxInfo = await this.getPoxInfo();
    // derive bitcoin address from Stacks account and convert into required format
    const hashbytes = bufferCV(Buffer.from(c32addressDecode(this.address)[1], 'hex'));
    const version = bufferCV(Buffer.from('01', 'hex'));

    const [contractAddress, contractName] = (await this.getPoxInfo()).contract_id.split('.');

    // read-only contract call
    const options: ReadOnlyFunctionOptions = {
      contractName,
      contractAddress,
      functionName: 'can-stack-stx',
      senderAddress: this.address,
      functionArgs: [
          tupleCV({
            hashbytes,
            version,
          }),
          uintCV(balance.toString()),
          // explicilty check eligibility for next cycle
          uintCV(poxInfo.reward_cycle_id),
          uintCV(cycles)
        ],
    }

    const isEligibleCV = await callReadOnlyFunction(options);

    return isEligibleCV.type === ClarityType.BoolTrue;
  }

  async lockStx({
    amountMicroStx,
    poxAddress,
    cycles,
    key,
    contract,
    burnBlockHeight,
  }: {
    key: string;
    cycles: number;
    poxAddress: string;
    amountMicroStx: BigNumber;
    contract: string;
    burnBlockHeight: number;
  }) {
    const txOptions = this.getLockTxOptions({
      amountMicroStx,
      cycles,
      poxAddress,
      contract,
      burnBlockHeight,
    });
    const tx = await makeContractCall({
      ...txOptions,
      senderKey: key,
    });
    const res = await broadcastTransaction(tx, txOptions.network as StacksNetwork);
    if (typeof res === 'string') {
      return res;
    }
    throw new Error(`${res.error} - ${res.reason}`);
  }

  getLockTxOptions({
    amountMicroStx,
    poxAddress,
    cycles,
    contract,
    burnBlockHeight,
  }: {
    cycles: number;
    poxAddress: string;
    amountMicroStx: BigNumber;
    contract: string;
    burnBlockHeight: number;
  }) {
    const { version, hash } = this.convertBTCAddress(poxAddress);
    const versionBuffer = bufferCV(new BN(version, 10).toBuffer());
    const hashbytes = bufferCV(hash);
    const address = tupleCV({
      hashbytes,
      version: versionBuffer,
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

  modifyLockTxFee({ tx, amountMicroStx }: { tx: StacksTransaction; amountMicroStx: BigNumber }) {
    const fee = tx.auth.getFee() as BN;
    (tx.payload as ContractCallPayload).functionArgs[0] = uintCV(
      new BN(amountMicroStx.toString(10), 10).sub(fee).toBuffer()
    );
    return tx;
  }

  convertBTCAddress(btcAddress: string) {
    return address.fromBase58Check(btcAddress);
  }

  getBTCAddress(version: Buffer, checksum: Buffer) {
    const btcAddress = address.toBase58Check(checksum, new BN(version).toNumber());
    return btcAddress;
  }
}
