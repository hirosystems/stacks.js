/**
 * TODO: fetch-mock has typings but we use the lib inappropriately.
 * This type def allows those usages to pass Typescript checks,
 * but we should eventually just fix the usage.
 */
declare module 'fetch-mock' {
  import orig from 'fetch-mock/index'

  interface Extras {
    post(arg: any): any;
    postOnce(arg: any): any;
  }

  let fetchMock: orig.FetchMockStatic & Extras
  export = fetchMock;
}
