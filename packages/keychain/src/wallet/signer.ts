// @ts-ignore
import { Buffer, IntegerType } from '@stacks/common';
import {
  makeContractCall,
  makeContractDeploy,
  TransactionVersion,
  ClarityValue,
  makeSTXTokenTransfer,
  PostConditionMode,
  getAddressFromPrivateKey,
  PostCondition,
  AnchorMode,
} from '@stacks/transactions';
import { StacksTestnet, StacksNetwork, StacksNetworkName } from '@stacks/network';

import RPCClient from '@blockstack/rpc-client';

interface ContractCallOptions {
  contractName: string;
  contractAddress: string;
  functionName: string;
  functionArgs: ClarityValue[];
  version: TransactionVersion;
  nonce: IntegerType;
  postConditions?: PostCondition[];
  postConditionMode?: PostConditionMode;
  network?: StacksNetworkName | StacksNetwork;
  anchorMode: AnchorMode;
}

interface ContractDeployOptions {
  contractName: string;
  codeBody: string;
  version: TransactionVersion;
  nonce: number;
  postConditions?: PostCondition[];
  postConditionMode?: PostConditionMode;
  network?: StacksNetworkName | StacksNetwork;
  anchorMode: AnchorMode;
}

interface STXTransferOptions {
  recipient: string;
  amount: string;
  memo?: string;
  nonce: number;
  postConditions?: PostCondition[];
  postConditionMode?: PostConditionMode;
  network?: StacksNetworkName | StacksNetwork;
  anchorMode: AnchorMode;
}

export class WalletSigner {
  privateKey: Buffer;

  constructor({ privateKey }: { privateKey: Buffer }) {
    this.privateKey = privateKey;
  }

  getSTXAddress(version: TransactionVersion) {
    return getAddressFromPrivateKey(this.getSTXPrivateKey(), version);
  }

  getSTXPrivateKey(): Buffer {
    return this.privateKey;
  }

  getNetwork() {
    return new StacksTestnet();
  }

  async fetchAccount({
    version,
    rpcClient,
  }: {
    version: TransactionVersion;
    rpcClient: RPCClient;
  }) {
    const address = this.getSTXAddress(version);
    const account = await rpcClient.fetchAccount(address);
    return account;
  }

  async signContractCall({
    contractName,
    contractAddress,
    functionName,
    functionArgs,
    nonce,
    postConditionMode,
    postConditions,
    anchorMode,
  }: ContractCallOptions) {
    const tx = await makeContractCall({
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey: this.getSTXPrivateKey().toString('hex'),
      nonce: nonce,
      network: this.getNetwork(),
      postConditionMode,
      postConditions,
      anchorMode,
    });
    return tx;
  }

  async signContractDeploy({
    contractName,
    codeBody,
    nonce,
    postConditionMode,
    postConditions,
    anchorMode,
  }: ContractDeployOptions) {
    const tx = await makeContractDeploy({
      contractName,
      codeBody: codeBody,
      senderKey: this.getSTXPrivateKey().toString('hex'),
      network: this.getNetwork(),
      nonce: BigInt(nonce),
      postConditionMode,
      postConditions,
      anchorMode,
    });
    return tx;
  }

  async signSTXTransfer({
    recipient,
    amount,
    memo,
    nonce,
    postConditionMode,
    postConditions,
    anchorMode,
  }: STXTransferOptions) {
    const tx = await makeSTXTokenTransfer({
      recipient,
      amount: BigInt(amount),
      memo,
      senderKey: this.getSTXPrivateKey().toString('hex'),
      network: this.getNetwork(),
      nonce: BigInt(nonce),
      postConditionMode,
      postConditions,
      anchorMode,
    });
    return tx;
  }
}
