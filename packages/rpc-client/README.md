# @stacks/rpc-client

Client library for working with [Stacks blockchain RPC interface](https://github.com/stacks-network/stacks-core/blob/master/docs/rpc/openapi.yaml).

## Installation

```
npm install @stacks/rpc-client
```

## Usage

```typescript
import { createClient } from '@stacks/rpc-client';
import { StacksTestnet } from '@stacks/network';

const client = createClient(new StacksTestnet());
const result = await client.GET('/v2/accounts/{principal}', {
  params: {
    path: { principal: 'ST2QKZ4FKHAH1NQKYKYAYZPY440FEPK7GZ1R5HBP2' },
    query: { tip: 'latest', proof: 0 },
  },
});

console.log(result.data); // { "balance": "0x000000000000000000228fb60297b639", ... }
```
