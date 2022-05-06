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

export function createApiKeyMiddleware({
  apiKey,
  host = /(.*)api(.*)\.stacks\.co$/i,
  httpHeader = 'x-api-key',
}: ApiKeyMiddlewareOpts): FetchMiddleware {
  return {
    pre: context => {
      const reqUrl = new URL(context.url);
      let hostMatches = false;
      if (typeof host === 'string') {
        hostMatches = host === reqUrl.host;
      } else {
        hostMatches = !!host.exec(reqUrl.host);
      }
      if (hostMatches) {
        const headers = new Headers(context.init.headers);
        headers.set(httpHeader, apiKey);
        context.init.headers = headers;
      }
    },
  };
}

function getDefaultMiddleware(): FetchMiddleware[] {
  const setOriginMiddleware: FetchMiddleware = {
    pre: context => {
      // Send only the origin in the Referer header. For example, a document
      // at https://example.com/page.html will send the referrer https://example.com/
      context.init.referrerPolicy = 'origin';
    },
  };
  return [setOriginMiddleware];
}

export function getDefaultFetchFn(fetchLib: FetchFn, ...middleware: FetchMiddleware[]): FetchFn;
export function getDefaultFetchFn(...middleware: FetchMiddleware[]): FetchFn;
export function getDefaultFetchFn(...args: any[]): FetchFn {
  let fetchLib: FetchFn = fetch;
  let middlewareOpt: FetchMiddleware[] = [];
  if (args.length > 0) {
    if (typeof args[0] === 'function') {
      fetchLib = args.shift();
    }
  }
  if (args.length > 0) {
    middlewareOpt = args;
  }
  const middlewares = [...getDefaultMiddleware(), ...middlewareOpt];
  const fetchFn = async (url: string, init?: RequestInit | undefined): Promise<Response> => {
    let fetchParams = { url, init: init ?? {} };
    for (const middleware of middlewares) {
      if (middleware.pre) {
        const result = await Promise.resolve(
          middleware.pre({
            fetch: fetchLib,
            ...fetchParams,
          })
        );
        fetchParams = result ?? fetchParams;
      }
    }
    let response = await fetchLib(fetchParams.url, fetchParams.init);
    for (const middleware of middlewares) {
      if (middleware.post) {
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
    }
    return response;
  };
  return fetchFn;
}
