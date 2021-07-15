import {
  makeSTXTokenTransfer,
  makeStandardSTXPostCondition,
  broadcastTransaction,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
const BigNum = require('bn.js');

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();

const txOptions = {
  recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
  amount: new BigNum(12345),
  senderKey: 'b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01',
  network,
  memo: 'test memo',
  nonce: new BigNum(0), // set a nonce manually if you don't want builder to fetch from a Stacks node
  fee: new BigNum(200), // set a tx fee if you don't want the builder to estimate
  anchorMode: AnchorMode.Any
};

const transaction = await makeSTXTokenTransfer(txOptions);

// to see the raw serialized tx
const serializedTx = transaction.serialize().toString('hex');

// broadcasting transaction to the specified network
broadcastTransaction(transaction, network);

