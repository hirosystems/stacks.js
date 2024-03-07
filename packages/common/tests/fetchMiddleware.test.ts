import fetchMock from 'jest-fetch-mock';
import {
  createApiKeyMiddleware,
  createFetchFn,
  FetchMiddleware,
  RequestContext,
  ResponseContext,
} from '../src/fetch';

beforeEach(() => {
  fetchMock.resetMocks();
});

test('createApiKeyMiddleware adds x-api-key header to correct host request', async () => {
  const apiKey = 'MY_KEY';

  const middleware = createApiKeyMiddleware({ apiKey });
  expect(middleware.pre).not.toBeNull();

  const fetchFn = createFetchFn(middleware);

  await fetchFn('https://example.com');
  expect(fetchMock.mock.calls[0][1]?.headers).toStrictEqual({ 'x-hiro-product': 'stacksjs' });

  await fetchFn('https://api.stacks.co');
  expect((fetchMock.mock.calls[1][1]?.headers as Headers)?.get('x-api-key')).toContain(apiKey);

  await fetchFn('https://api.hiro.so');
  expect((fetchMock.mock.calls[1][1]?.headers as Headers)?.get('x-api-key')).toContain(apiKey);
});

test('middleware calls pre and post', async () => {
  const preMiddleware = jest.fn(() => undefined as void);
  const postMiddleware = jest.fn(() => undefined as void);

  const middleware = {
    pre: preMiddleware,
    post: postMiddleware,
  } as FetchMiddleware;

  const fetchFn = createFetchFn(middleware);
  await fetchFn('https://example.com');

  expect(preMiddleware.mock.calls.length).toBe(1);
  expect(postMiddleware.mock.calls.length).toBe(1);
});

test('pre middleware chains pass state', async () => {
  const middleware1 = jest.fn((ctx: RequestContext) => {
    ctx.init.headers = new Headers();
    ctx.init.headers.set('foo', 'bar');
    return ctx;
  });
  const middleware2 = jest.fn((ctx: RequestContext) => {
    expect((ctx.init.headers as Headers).get('foo')).toBe('bar');
    (ctx.init.headers as Headers).set('foo', 'bla');
    // should also work if middleware doesn't return context, but rather changes in-place
  });
  const middleware3 = jest.fn((ctx: RequestContext) => {
    expect((ctx.init.headers as Headers).get('foo')).toBe('bla');
    (ctx.init.headers as Headers).set('foo', 'baz');
    return ctx;
  });

  const fetchFn = createFetchFn(
    {
      pre: middleware1,
    },
    {
      pre: middleware2,
    },
    {
      pre: middleware3,
    }
  );

  await fetchFn('https://example.com');
  expect((fetchMock.mock.calls[0][1]?.headers as Headers).get('foo')).toBe('baz');

  expect(middleware1.mock.calls.length).toBe(1);
  expect(middleware2.mock.calls.length).toBe(1);
  expect(middleware3.mock.calls.length).toBe(1);
});

test('post middleware chains pass state', async () => {
  fetchMock.mockResponse(JSON.stringify({ someString: 'something' }));

  const middleware1 = jest.fn(async (ctx: ResponseContext) => {
    const res = await ctx.response.json();
    expect(res.someString).toBe('something');
    // overriding the response should be passed to the next middleware
    return new Response(JSON.stringify({ someNumber: 42 }));
  });
  const middleware2 = jest.fn(async (ctx: ResponseContext) => {
    expect((await ctx.response.json()).someNumber).toBe(42);
  });

  const fetchFn = createFetchFn(
    {
      post: middleware1,
    },
    {
      post: middleware2,
    }
  );
  await fetchFn('https://example.com');

  expect(middleware1.mock.calls.length).toBe(1);
  expect(middleware2.mock.calls.length).toBe(1);
});

test('post middleware response.clone works', async () => {
  const middlewareJson = jest.fn(async (ctx: ResponseContext) => {
    // getting the response body should work multiple times
    await ctx.response.text();
  });

  const fetchFn = createFetchFn(
    {
      post: middlewareJson,
    },
    {
      post: middlewareJson,
    }
  );
  await fetchFn('https://example.com');

  expect(middlewareJson.mock.calls.length).toBe(2);
});
