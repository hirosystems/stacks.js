import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import {
  makeContractCall,
  bufferCV,
  uintCV,
  tupleCV,
  broadcastTransaction,
  standardPrincipalCV,
  serializeCV,
  deserializeCV,
  TupleCV,
  ContractCallOptions,
  UIntCV,
  BufferCV,
  ContractCallPayload,
  StacksTransaction,
} from '@stacks/transactions';
import {
  StacksTestnet,
  StacksNetwork
} from '@stacks/network';
import BN from 'bn.js';
import { address } from 'bitcoinjs-lib';
import urljoin from 'url-join';

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

interface PoxInfo {
  contract_id: string;
  first_burnchain_block_height: number;
  min_amount_ustx: number;
  registration_window_length: 250;
  rejection_fraction: number;
  reward_cycle_id: number;
  reward_cycle_length: number;
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

export class Pox {
  constructor(public nodeUrl: string) {}

  async getPoxInfo(): Promise<PoxInfo> {
    const url = `${this.nodeUrl}/v2/pox`;
    const res = await axios.get<PoxInfo>(url);
    return res.data;
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
    const network = new StacksTestnet();
    network.coreApiUrl = this.nodeUrl;
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

  async getStackerInfo(address: string): Promise<StackerInfo> {
    const info = await this.getPoxInfo();
    const args = [`0x${serializeCV(standardPrincipalCV(address)).toString('hex')}`];
    const [contractAddress, contractName] = info.contract_id.split('.');
    const url = urljoin(
      this.nodeUrl,
      `/v2/contracts/call-read/${contractAddress}/${contractName}/get-stacker-info`
    );
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

  convertBTCAddress(btcAddress: string) {
    return address.fromBase58Check(btcAddress);
  }

  getBTCAddress(version: Buffer, checksum: Buffer) {
    const btcAddress = address.toBase58Check(checksum, new BN(version).toNumber());
    return btcAddress;
  }
}
