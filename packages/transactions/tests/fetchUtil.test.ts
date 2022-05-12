import { createApiKeyMiddleware, createFetchFn, StacksTestnet } from '@stacks/network';
import fetchMock from 'jest-fetch-mock';
import { broadcastTransaction, makeSTXTokenTransfer } from '../src/builders';
import { AnchorMode } from '../src/constants';

test('fetchFn is used in network requests', async () => {
  const apiKey = 'MY_KEY';
  const middleware = createApiKeyMiddleware({ apiKey });
  const fetchFn = createFetchFn(middleware);
  const network = new StacksTestnet({ fetchFn });

  const transaction = await makeSTXTokenTransfer({
    recipient: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
    amount: 12_345,
    fee: 0,
    nonce: 0,
    senderKey: 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01',
    memo: 'test memo',
    anchorMode: AnchorMode.Any,
  });

  fetchMock.mockOnce('success');
  await broadcastTransaction(transaction, network);

  expect((fetchMock.mock.calls[0][1]?.headers as Headers)?.get('x-api-key')).toContain(apiKey);
});
