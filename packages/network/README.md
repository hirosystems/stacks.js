# @stacks/network

Network and API library for working with Stacks blockchain nodes.

## Installation

```
npm install @stacks/network
```

## Usage

Creating a Stacks mainnet, testnet or mocknet network

```typescript
import { StacksMainnet, StacksTestnet, StacksMocknet } from '@stacks/network';

const network = new StacksMainnet();

const testnet = new StacksTestnet();

const mocknet = new StacksMocknet();
```

Setting a custom node URL

```typescript
network.coreApiUrl = 'https://www.mystacksnode.com/';
```

Check if network is mainnet

```typescript
const isMainnet = network.isMainnet();
```

Example usage in transaction builder

```typescript
import { makeSTXTokenTransfer } from '@stacks/transactions';

const txOptions = {
  network,
  recipient: 'SP2BS6HD7TN34V8Z5BNF8Q2AW3K8K2DPV4264CF26',
  amount: new BigNum(12345),
  senderKey: 'b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01',
};

const transaction = await makeSTXTokenTransfer(txOptions);
```

Get various API URLs

```typescript
  const txBroadcastUrl = network.getBroadcastApiUrl();

  const feeEstimateUrl = network.getTransferFeeEstimateApiUrl();

  const address = 'SP2BS6HD7TN34V8Z5BNF8Q2AW3K8K2DPV4264CF26';
  const accountInfoUrl = network.getAccountApiUrl(address);

  const contractName = 'hello_world';
  const abiUrl = network.getAbiApiUrl(address, contractName);

  const functionName = 'hello';
  const readOnlyFunctionCallUrl = network.getReadOnlyFunctionCallApiUrl(address, contractName, functionName);

  const nodeInfoUrl = network.getInfoUrl();

  const blockTimeUrl = network.getBlockTimeInfoUrl();

  const poxInfoUrl = network.getPoxInfoUrl();
```