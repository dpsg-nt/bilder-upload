export const retry = async <T>(times: number, delayInMs: number, fn: () => Promise<T>): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`Failed to execute retryable function (try ${i + 1} of ${times}).`, e);
      lastError = e;
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
    }
  }
  throw lastError;
};
