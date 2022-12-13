# @stacks/network

Network and API library for working with Stacks blockchain nodes.

## Installation

```
npm install @stacks/network
```

## Usage

### Create a Stacks mainnet, testnet or mocknet network

```typescript
import { StacksMainnet, StacksTestnet, StacksMocknet } from '@stacks/network';

const network = new StacksMainnet();

const testnet = new StacksTestnet();

const mocknet = new StacksMocknet();
```

### Set a custom node URL

```typescript
const network = new StacksMainnet({ url: 'https://www.mystacksnode.com/' });
```

### Check if network is mainnet

```typescript
const isMainnet = network.isMainnet();
```

### Network usage in transaction building

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

### Use the built-in API key middleware

Some Stacks APIs make use API keys to provide less rate-limited plans.

```typescript
import { createApiKeyMiddleware, createFetchFn, StacksMainnet } from '@stacks/network';
import { broadcastTransaction, getNonce, makeSTXTokenTransfer } from '@stacks/transactions';

const myApiMiddleware = createApiKeyMiddleware('example_e8e044a3_41d8b0fe_3dd3988ef302');
const myFetchFn = createFetchFn(myApiMiddleware); // middlewares can be used to create a new fetch function
const myMainnet = new StacksMainnet({ fetchFn: myFetchFn }); // the fetchFn options can be passed to a StacksNetwork to override the default fetch function

const txOptions = {
  recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
  amount: 12345n,
  senderKey: 'b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01',
  memo: 'some memo',
  anchorMode: AnchorMode.Any,
  network: myMainnet, // make sure to pass in the custom network object
};
const transaction = await makeSTXTokenTransfer(txOptions); // fee-estimation will use the custom fetchFn

const response = await broadcastTransaction(transaction, myMainnet); // make sure to broadcast via the custom network object

// stacks.js functions, which take a StacksNetwork object will use the custom fetchFn
const nonce = await getNonce('SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159', myMainnet);
```

### Use custom middleware

Middleware can be used to hook into network calls before sending a request or after receiving a response.

```typescript
import { createFetchFn, RequestContext, ResponseContext, StacksTestnet } from '@stacks/network';
import { broadcastTransaction, getNonce, makeSTXTokenTransfer } from '@stacks/transactions';

const preMiddleware = (ctx: RequestContext) => {
  ctx.init.headers = new Headers();
  ctx.init.headers.set('x-foo', 'bar'); // override headers and set new `x-foo` header
};
const postMiddleware = (ctx: ResponseContext) => {
  console.log(await ctx.response.json()); // log response body as json
};

const fetchFn = createFetchFn({ pre: preMiddleware, post: preMiddleware }); // a middleware can contain `pre`, `post`, or both
const network = new StacksTestnet({ fetchFn });

// stacks.js functions, which take a StacksNetwork object will use the custom fetchFn
const nonce = await getNonce('SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159', network);
```

### Get various API URLs

```typescript
const txBroadcastUrl = network.getBroadcastApiUrl();

const feeEstimateUrl = network.getTransferFeeEstimateApiUrl();

const address = 'SP2BS6HD7TN34V8Z5BNF8Q2AW3K8K2DPV4264CF26';
const accountInfoUrl = network.getAccountApiUrl(address);

const contractName = 'hello_world';
const abiUrl = network.getAbiApiUrl(address, contractName);

const functionName = 'hello';
const readOnlyFunctionCallUrl = network.getReadOnlyFunctionCallApiUrl(
  address,
  contractName,
  functionName
);

const nodeInfoUrl = network.getInfoUrl();

const blockTimeUrl = network.getBlockTimeInfoUrl();

const poxInfoUrl = network.getPoxInfoUrl();
```
