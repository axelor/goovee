/* Small concurrency helpers for the parity script: run an async action over a
 * list in fixed-size batches so we don't fire one HTTP request per product all
 * at once against the AOS back end. */

const BATCH_SIZE = 10;

export async function processBatch<T, R>(
  data: T[],
  action: (data: NoInfer<T>) => Promise<R>,
  batchSize: number = BATCH_SIZE,
): Promise<R[]> {
  const chunks = chunkArray(data, batchSize);

  const results: R[] = [];
  for (const chunk of chunks) {
    const result = await Promise.all(chunk.map(data => action(data)));
    results.push(...result);
  }
  return results;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
