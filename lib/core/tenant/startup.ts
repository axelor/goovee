import {listTenantConfigs} from './config';
import {CONNECT_COOLDOWN_MS, manager} from './manager';
import {PREPARE_COOLDOWN_MS, prepareDatabase} from './prepare';

/*
 * Waits between attempts on a database that is not ready at boot. Each exceeds
 * the cooldown a failed attempt stands for, so every retry is a real attempt
 * rather than the previous failure handed back.
 */
const RETRY_COOLDOWN_MS = Math.max(PREPARE_COOLDOWN_MS, CONNECT_COOLDOWN_MS);
const RETRY_DELAYS_MS = [1, 2, 4, 8].map(
  factor => factor * RETRY_COOLDOWN_MS + 1_000,
);

/*
 * Databases prepared at once. Each preparation builds a full set of entity
 * metadata before it is released, so an uncapped fan-out over many tenants
 * would allocate all of that in one burst.
 */
const PREPARE_CONCURRENCY = 5;

export type TenantReadyListener = (tenantId: string) => Promise<void>;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms);
    timer.unref?.();
  });
}

async function forEachWithLimit<Item>(
  items: Item[],
  limit: number,
  work: (item: Item) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  const workers = Array.from(
    {length: Math.min(limit, items.length)},
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex++];
        await work(item);
      }
    },
  );

  await Promise.all(workers);
}

/** True once `attempt` succeeded; false after the last retry failed. */
async function withRetry(
  label: string,
  attempt: () => Promise<void>,
): Promise<boolean> {
  for (let attemptIndex = 0; ; attemptIndex++) {
    try {
      await attempt();
      return true;
    } catch (err) {
      const delay = RETRY_DELAYS_MS[attemptIndex];

      if (delay === undefined) {
        console.error(`[TENANT][STARTUP] ${label} failed, giving up:`, err);
        return false;
      }

      console.warn(
        `[TENANT][STARTUP] ${label} failed, retrying in ${delay / 1000}s (attempt ${attemptIndex + 1}/${RETRY_DELAYS_MS.length})`,
      );
      await sleep(delay);
    }
  }
}

async function startAll(onReady?: TenantReadyListener): Promise<void> {
  let configs: ReturnType<typeof listTenantConfigs>;

  try {
    configs = listTenantConfigs();
  } catch (err) {
    console.error(
      '[TENANT][STARTUP] Could not read the tenant configuration:',
      err,
    );
    return;
  }

  /* Several tenants may share a database, which is then prepared once. */
  const tenantsByDatabase = new Map<string, string[]>();

  for (const [tenantId, config] of configs) {
    const tenantIds = tenantsByDatabase.get(config.db.url) ?? [];
    tenantIds.push(tenantId);
    tenantsByDatabase.set(config.db.url, tenantIds);
  }

  await forEachWithLimit(
    [...tenantsByDatabase.entries()],
    PREPARE_CONCURRENCY,
    async ([url, tenantIds]) => {
      /* Databases are named by the tenants they serve, never by their url:
       * the url carries the password. */
      const names = tenantIds.map(tenantId => `"${tenantId}"`).join(', ');

      const prepared = await withRetry(
        `Preparing the database of ${names}`,
        () => prepareDatabase(url),
      );

      if (!prepared) {
        return;
      }

      for (const tenantId of tenantIds) {
        const connected = await withRetry(
          `Connecting tenant "${tenantId}"`,
          async () => {
            await manager.getTenant(tenantId);
          },
        );

        if (!connected || !onReady) {
          continue;
        }

        /* The tenant is connected whatever happens here; only the work that
         * was to follow is lost, and requests are not affected. */
        try {
          await onReady(tenantId);
        } catch (err) {
          console.error(
            `[TENANT][STARTUP] Resuming tenant "${tenantId}" failed:`,
            err,
          );
        }
      }
    },
  );
}

/**
 * Prepares every configured database and connects every tenant in the
 * background. Nothing here blocks startup: a request that arrives before its
 * tenant is ready waits for that tenant alone. `onReady` runs once per tenant
 * after it is connected; a failure there is logged and never stops the rest.
 */
export function startTenants(onReady?: TenantReadyListener): void {
  void startAll(onReady);
}
