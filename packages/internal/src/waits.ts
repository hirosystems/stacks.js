export async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const sleep = timeout;

export async function waitForFulfilled(fn: () => Promise<any>, interval: number = 300) {
  console.log(`waiting for fn fulfilled '${fn.name}'...`);
  while (true) {
    try {
      const result = await fn();
      console.log(`fn fulfilled '${fn.name}'`);
      return;
    } catch (error) {
      await timeout(interval);
    }
  }
}
