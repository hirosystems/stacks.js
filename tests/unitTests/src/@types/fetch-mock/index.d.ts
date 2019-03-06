declare module 'fetch-mock' {
    import orig from 'fetch-mock/index'
    //export * from 'fetch-mock/index'
    
    interface Extras {
      post(arg: any): any;
      postOnce(arg: any): any;
    }

    var fetchMock: orig.FetchMockStatic & Extras;
    export = fetchMock;
  }
  