export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutMs = maxDelayMs;

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt < maxRetries) {
        const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
