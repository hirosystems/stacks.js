import fetchMock from 'jest-fetch-mock';
import { broadcastTransaction } from '../src';
import { makeSTXTokenTransfer } from '../src/builders';
import { AnchorMode } from '../src/constants';
import { createApiKeyMiddleware, createFetchFn } from '@stacks/common';

test('fetchFn is used in network requests', async () => {
  const apiKey = 'MY_KEY';
  const middleware = createApiKeyMiddleware({ apiKey });
  const fetchFn = createFetchFn(middleware);
  const api = { fetch: fetchFn };

  const transaction = await makeSTXTokenTransfer({
    recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
    amount: 12_345,
    fee: 0,
    nonce: 0,
    senderKey: 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01',
    memo: 'test memo',
    anchorMode: AnchorMode.Any,
  });

  const txid = transaction.txid();
  fetchMock.mockOnce(`"${txid}"`);

  await broadcastTransaction({ transaction, api });

  expect((fetchMock.mock.calls[0][1]?.headers as Headers)?.get('x-api-key')).toContain(apiKey);
});
