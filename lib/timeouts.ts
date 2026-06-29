export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: () => T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      })
    ]);
    return result;
  } catch {
    return fallback();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
