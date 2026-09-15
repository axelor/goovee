import {memoizeAsync} from '@/cache/memoize';
import {createClient} from '@/goovee/.generated/client';
import {processWide} from '@/runtime/process-wide';

/*
 * Serialises schema work on one database across every server process that
 * shares it. Advisory locks are scoped to the database they are taken in, so a
 * single constant is enough: two processes preparing different databases never
 * meet, and two preparing the same one take turns.
 */
const SCHEMA_LOCK_KEY = 7364812001;

/** How long a failed preparation stands before the next caller may retry it. */
export const PREPARE_COOLDOWN_MS = 10_000;

/* Process-wide like the tenant registry: a map of this module's own would
 * prepare every database once per module graph. */
const PREPARED_DATABASES = 'tenant/prepared-databases';

async function prepare(url: string): Promise<void> {
  /* A client of its own, released as soon as the work is done. The schema is a
   * property of the database, not of whichever client the request path opens
   * later, so preparing it must not wait for one of those to exist. */
  const client = createClient({url});

  await client.$connect();

  try {
    await client.$transaction(async txClient => {
      /* Held by this transaction's connection until it commits. The schema
       * work below runs on other connections of the same pool and does not
       * need the lock itself; what matters is that no other process is inside
       * this block for the same database at the same time. */
      await txClient.$raw(
        'SELECT pg_advisory_xact_lock($1::bigint)',
        SCHEMA_LOCK_KEY,
      );

      await client.$sync();
      await client.$raw('CREATE EXTENSION IF NOT EXISTS unaccent');
    });
  } finally {
    /* Logged rather than thrown: a failure to release must not replace the
     * error that brought us here, and a success has nothing to add. */
    await client.$disconnect().catch((disconnectError: unknown) => {
      console.error(
        'Failed to release the client that prepared a database:',
        disconnectError,
      );
    });
  }
}

/**
 * Brings a database's schema up to date and makes sure the extensions the
 * portal relies on exist. Runs once per database per process: the first caller
 * does the work and every later one, from any part of the server, awaits the
 * same promise. Keyed by url because several tenants may share one database.
 */
export function prepareDatabase(url: string): Promise<void> {
  const prepared = processWide(
    PREPARED_DATABASES,
    () => new Map<string, Promise<void>>(),
  );

  return memoizeAsync(prepared, url, () => prepare(url), {
    failureTtlMs: PREPARE_COOLDOWN_MS,
  });
}
