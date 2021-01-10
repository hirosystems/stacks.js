import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { config as blockstackConfig } from '@stacks/common';

blockstackConfig.logLevel = 'none';

const customGlobal: GlobalWithFetchMock = (global as any) as GlobalWithFetchMock;
customGlobal.fetch = require('jest-fetch-mock');
customGlobal.fetchMock = customGlobal.fetch;

beforeEach(() => {
  fetchMock.mockClear();
});
