import fetchMock from 'fetch-mock';
import { createApiKeyMiddleware, createFetchFn, StacksMainnet } from '@stacks/network';
import { InfoResponse, createClient } from '../src';

let fetch: fetchMock.FetchMockSandbox;

// eslint-disable-next-line prettier/prettier
const sampleInfoResponse = {"peer_version":402653194,"pox_consensus":"06500d858ae0f7fa9bdc8e036636ac0c5efe685b","burn_block_height":856869,"stable_pox_consensus":"e7812643d4483f529c370be6d7bd0f4a4fa3acbc","stable_burn_block_height":856862,"server_version":"stacks-node 2.5.0.0.5 (release/2.5.0.0.5:e29ef68, release build, linux [x86_64])","network_id":1,"parent_network_id":3652501241,"stacks_tip_height":161965,"stacks_tip":"ec663d98eff1bb0c6a3038acb3400eabb9efac1382f6fe67a0b809b585ca7be9","stacks_tip_consensus_hash":"06500d858ae0f7fa9bdc8e036636ac0c5efe685b","genesis_chainstate_hash":"74237aa39aa50a83de11a4f53e9d3bb7d43461d1de9873f402e5453ae60bc59b","unanchored_tip":null,"unanchored_seq":null,"exit_at_block_height":null,"node_public_key":"025ff38b10ed81a74971e05e2685b184f75e8b53a0e9c01cccc4aad8325fe3b349","node_public_key_hash":"975c8851d8baf8aa5478caa73b34dd64bdd7bc3c","affirmations":{"heaviest":"ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp","stacks_tip":"pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp","sortition_tip":"pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp","tentative_best":"pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp"},"last_pox_anchor":{"anchor_block_hash":"882a658ba91bcf85b54d6738a75bffb775b83bd5ac4b963224783fb6acb25730","anchor_block_txid":"292b72a7fc710b5ff0115ee8989e20523cd1711a632e557145bd9d9449e8462c"},"stackerdbs":[]};
function mockInfoRequest() {
  fetch.mock('path:/v2/info', JSON.stringify(sampleInfoResponse));
}

beforeAll(() => {
  fetch = fetchMock.sandbox();
});

beforeEach(() => {
  fetch.reset();
  mockInfoRequest();
});

test('RPC client tests', async () => {
  const network = new StacksMainnet({ fetchFn: fetch, url: 'https://test.rpc.stacks.local' });
  const client = createClient(network);

  const result = await client.GET('/v2/info');
  if (!result.data) {
    throw result;
  }
  const infoResponse = result.data;

  // Test InfoResponse type definition
  const typeTest: InfoResponse = infoResponse;
  expect(typeTest).toBeTruthy();

  // Test endpoint called
  expect(fetch.calls()[0][0]).toBe(`${network.coreApiUrl}/v2/info`);

  // Test response data
  expect(infoResponse.stacks_tip).toBe(sampleInfoResponse.stacks_tip);
});

test('path and query params', async () => {
  const network = new StacksMainnet({ fetchFn: fetch, url: 'https://test.rpc.stacks.local' });
  const client = createClient(network);

  const mockResp = { test: 'test' };
  fetch.mock('*', JSON.stringify(mockResp));
  const testPrincipal = 'ST1PQHQKV0YKXK6XZP3ZQZQZGZGZQYQKQZQZQZQZ';
  const result = await client.GET('/v2/accounts/{principal}', {
    params: {
      path: { principal: testPrincipal },
      query: { tip: 'latest' },
    },
  });
  if (!result.data) {
    throw result;
  }

  // Test endpoint called
  expect(fetch.calls()[0][0]).toBe(`${network.coreApiUrl}/v2/accounts/${testPrincipal}?tip=latest`);

  // Test response data
  expect(result.data).toEqual(mockResp);
});

test('createApiKeyMiddleware works with rpc-client', async () => {
  const apiKey = 'MY_KEY';
  const middleware = createApiKeyMiddleware({ apiKey });
  const fetchFn = createFetchFn(fetch, middleware);
  const network = new StacksMainnet({ fetchFn });

  const client = createClient(network);
  await client.GET('/v2/info');

  expect((fetch.calls()[0][1]?.headers as Headers).get('x-api-key')).toBe(apiKey);
});

test('openapi-fetch middleware works with rpc-client', async () => {
  const testHeader = 'x-openapi-fetch-middleware';
  const testHeaderVal = 'my_val';
  const network = new StacksMainnet({ fetchFn: fetch });
  const client = createClient(network);
  client.use({
    onRequest({ request }) {
      request.headers.set(testHeader, testHeaderVal);
      return request;
    },
  });
  await client.GET('/v2/info');

  expect((fetch.calls()[0][1]?.headers as Headers).get(testHeader)).toBe(testHeaderVal);
});

test('error response', async () => {
  const errorResp = { error: 'test error' };
  fetch.mock('*', {
    status: 500,
    body: JSON.stringify(errorResp),
  });
  const network = new StacksMainnet({ fetchFn: fetch });
  const client = createClient(network);
  const result = await client.GET('/v2/pox');
  expect(result.response.status).toBe(500);
  expect(result.error).toEqual(errorResp);
});
