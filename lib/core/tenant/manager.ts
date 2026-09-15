import {createClient} from '@/goovee/.generated/client';
import {ensureStorageDir} from '@/storage/index';
import {getTenantConfig} from './config';
import {prepareDatabase} from './prepare';
import {shareAttempt} from './single-flight';
import type {Tenant, TenantConfig} from './types';

/*
 * How long a failed connection stands before the next caller may retry it: a
 * database that is down is asked again once per window, not once per request.
 */
export const CONNECT_COOLDOWN_MS = 10_000;

/*
 * One entry per tenant for the life of the process. The configuration document
 * fixes the set of tenants at startup, so nothing here needs a capacity: an
 * entry leaves only when its connection failed, once the cooldown has passed.
 * A quiet tenant costs its metadata and an empty pool, since the driver closes
 * idle sockets on its own, and the process exiting is what closes the pools —
 * they hold nothing that needs flushing first.
 *
 * Held on `globalThis` for the reason the auth instances are (`lib/auth.ts`):
 * the server is built as two module graphs, route handlers with the middleware
 * and instrumentation in one and page renders in the other, and a module-level
 * map would exist once in each, connecting every tenant twice. A recompile in
 * development evaluates this module again as well. The registry outlives both,
 * so a tenant is connected once per process whichever side asks first.
 */
declare global {
  var __tenantRegistry: Map<Tenant['id'], Promise<Tenant>> | undefined;
}

async function connectTenant(
  id: Tenant['id'],
  config: TenantConfig,
): Promise<Tenant> {
  /* The schema has to be in place before the first query. Startup usually did
   * this long before any request; a tenant addressed earlier than that waits
   * here for the same preparation instead of starting one of its own. */
  await prepareDatabase(config.db.url);

  const client = createClient({
    url: config.db.url,
    features: {
      normalization: {
        lowerCase: true,
        unaccent: true,
      },
    },
  });

  try {
    await client.$connect();

    /* Storage is per-tenant config; make sure the directory exists before any
     * upload writes to it. */
    ensureStorageDir(config.aos.storage);
  } catch (err) {
    /* A source that never finished initialising holds no pool, and asking it
     * to release one throws, which would replace the error that matters. */
    if (client.$connected) {
      await client.$disconnect().catch((disconnectError: unknown) => {
        console.error(
          `Failed to release tenant "${id}" after a failed connection:`,
          disconnectError,
        );
      });
    }

    throw err;
  }

  return {id, config, client};
}

/*
 * One manager for every deployment. It serves the tenants the configuration
 * document names, connecting each the first time it is addressed.
 *
 * Connections only. Everything here returns a promise because it may open a
 * Postgres pool. Reading the configuration document is the other module's job
 * (`./config`), which is what the request path imports — code that can reach
 * this module can open a database, and the proxy must not be able to.
 */
export class TenantManager {
  private get registry(): Map<Tenant['id'], Promise<Tenant>> {
    return (global.__tenantRegistry ??= new Map());
  }

  /** Null for a missing id or one the configuration document does not name; a connection failure throws. */
  async getTenant(id: Tenant['id']): Promise<Tenant | null> {
    if (!id) {
      return null;
    }

    const config = getTenantConfig(id);

    if (!config) {
      /* Unknown tenant is not an error: a caller decides what a missing tenant
       * means for it. Throwing here would turn attacker-controllable path
       * values into 500s. A genuine connection failure below still throws. */
      return null;
    }

    try {
      /* Concurrent callers for a cold tenant share one connection attempt, so
       * the registry never holds a client that nothing references. */
      return await shareAttempt(
        this.registry,
        id,
        () => connectTenant(id, config),
        CONNECT_COOLDOWN_MS,
      );
    } catch (err) {
      throw new Error(`Error connecting tenant "${id}"`, {cause: err});
    }
  }

  async getClient(id: Tenant['id']) {
    return this.getTenant(id).then(tenant => tenant?.client);
  }
}

export const manager = new TenantManager();

export default manager;
