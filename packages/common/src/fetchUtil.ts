import 'cross-fetch/polyfill';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export interface RequestContext {
  fetch: FetchFn;
  url: string;
  init: RequestInit;
}

export interface ResponseContext {
  fetch: FetchFn;
  url: string;
  init: RequestInit;
  response: Response;
}

export interface FetchParams {
  url: string;
  init: RequestInit;
}

export interface FetchMiddleware {
  pre?: (context: RequestContext) => PromiseLike<FetchParams | void> | FetchParams | void;
  post?: (context: ResponseContext) => Promise<Response | void> | Response | void;
}
export interface ApiKeyMiddlewareOpts {
  /** The middleware / API key header will only be added to requests matching this host. */
  host?: RegExp | string;
  /** The http header name used for specifying the API key value. */
  httpHeader?: string;
  /** The API key string to specify as an http header value. */
  apiKey: string;
}

/** @internal */
export function hostMatches(host: string, pattern: string | RegExp) {
  if (typeof pattern === 'string') return pattern === host;
  return (pattern as RegExp).exec(host);
}

export function createApiKeyMiddleware({
  apiKey,
  host = /(.*)api(.*)\.stacks\.co$/i,
  httpHeader = 'x-api-key',
}: ApiKeyMiddlewareOpts): FetchMiddleware {
  return {
    pre: context => {
      const reqUrl = new URL(context.url);
      if (!hostMatches(reqUrl.host, host)) return; // Skip middleware if host does not match pattern

      const headers = new Headers(context.init.headers);
      headers.set(httpHeader, apiKey);
      context.init.headers = headers;
    },
  };
}

function createDefaultMiddleware(): FetchMiddleware[] {
  const setOriginMiddleware: FetchMiddleware = {
    pre: context => {
      // Send only the origin in the Referer header. For example, a document
      // at https://example.com/page.html will send the referrer https://example.com/
      context.init.referrerPolicy = 'origin';
    },
  };
  return [setOriginMiddleware];
}

// Argument helper function for {createFetchFn}
function argsForCreateFetchFn(args: any[]): { middlewares: FetchMiddleware[]; fetchLib: FetchFn } {
  let fetchLib: FetchFn = fetch;
  let middlewares: FetchMiddleware[] = [];
  if (args.length > 0 && typeof args[0] === 'function') {
    fetchLib = args.shift();
  }
  if (args.length > 0) {
    middlewares = args;
  }
  return { middlewares, fetchLib };
}

export function createFetchFn(fetchLib: FetchFn, ...middleware: FetchMiddleware[]): FetchFn;
export function createFetchFn(...middleware: FetchMiddleware[]): FetchFn;
export function createFetchFn(...args: any[]): FetchFn {
  const { middlewares: middlewareArgs, fetchLib } = argsForCreateFetchFn(args);
  const middlewares = [...createDefaultMiddleware(), ...middlewareArgs];

  const fetchFn = async (url: string, init?: RequestInit | undefined): Promise<Response> => {
    let fetchParams = { url, init: init ?? {} };
    for (const middleware of middlewares) {
      if (typeof middleware.pre !== 'function') continue;
      const result = await Promise.resolve(
        middleware.pre({
          fetch: fetchLib,
          ...fetchParams,
        })
      );
      fetchParams = result ?? fetchParams;
    }

    let response = await fetchLib(fetchParams.url, fetchParams.init);

    for (const middleware of middlewares) {
      if (typeof middleware.post !== 'function') continue;
      const result = await Promise.resolve(
        middleware.post({
          fetch: fetchLib,
          url: fetchParams.url,
          init: fetchParams.init,
          response: response.clone(),
        })
      );
      response = result ?? response;
    }
    return response;
  };
  return fetchFn;
}
