import * as tapeTest from 'tape-promise/tape'

function decorateTapeTest<T>(fn: T, opts: {
  beforeEach?: (testName: string) => void; 
  afterEach?: (testName: string) => void;
}): T {
  const result = function() {
    const args: any[] = [].slice.apply(arguments);
    const testName: string = args.length > 1 ? args[0] : ''
    const cb = args[args.length - 1]
    const wrappedCb = function() {
      if (opts.beforeEach) {
        opts.beforeEach(testName)
      }
      let testFn: any
      try {
        testFn = cb.apply(this, arguments)
        if (opts.afterEach && testFn instanceof Promise) {
          testFn.finally(() => {
            opts.afterEach(testName)
          })
        }
        return testFn
      }
      finally {
        if (opts.afterEach && !(testFn instanceof Promise)) {
          opts.afterEach(testName)
        }
      }
    }
    args[args.length - 1] = wrappedCb
    return (fn as any).apply(this, args)
  }
  return result as any
}

export function tapeInit(opts: {
  beforeEach?: (testName: string) => void; 
  afterEach?: (testName: string) => void;
}): typeof tapeTest {
  const result = decorateTapeTest(tapeTest, opts);
  result.only = decorateTapeTest(tapeTest.only, opts);
  result.skip = decorateTapeTest(tapeTest.skip, opts);
  return result;
}
