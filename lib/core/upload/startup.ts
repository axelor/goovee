// ---- CORE IMPORTS ---- //
import {DEFAULT_TENANT} from '@/constants';
import {manager, type TenantClient} from '@/tenant';

import {
  INITIAL_SWEEP_DELAY_MS,
  PRUNE_INTERVAL_MS,
  REAP_INTERVAL_MS,
} from './constants';
import {pruneStaleUploads, reapExpiredUploads} from './staged-upload';

/**
 * Periodic cleanup for staged uploads, started once at server startup from
 * `instrumentation.ts`. Two independent passes, each on its own cadence:
 *  - reap: abandoned (unconsumed + expired) uploads — claim, meta_file, blob;
 *  - prune: consumed claim rows past their retention window — claim row only.
 *
 * They run separately because their natural cadences differ: reap bounds the
 * disk/orphan window and wants a tight interval, while prune is a slow GC whose
 * candidates only appear as the retention clock advances.
 *
 * Single-instance only: there is no cross-instance lock, so running it on more
 * than one replica would have every replica act on the same rows. With
 * horizontal scaling this needs a Postgres advisory lock around each pass, or
 * to move behind an externally triggered route hit by a single scheduler.
 */

let started = false;

/**
 * Run `task` for every tenant, isolating per-tenant failures so one tenant's
 * error never aborts the rest of the sweep.
 */
async function forEachTenant(
  label: string,
  task: (tenantId: string, client: TenantClient) => Promise<void>,
): Promise<void> {
  /*
   * wip wires only DEFAULT_TENANT. Once per-tenant config lands (#113733),
   * swap this for `await manager.listTenantIds()` and pass the tenant's
   * `config.aos.storage` to the upload helpers.
   */
  for (const tenantId of [DEFAULT_TENANT]) {
    try {
      const client = await manager.getClient(tenantId);
      await task(tenantId, client);
    } catch (error) {
      console.error(
        `[UPLOAD][${label}] failed for tenant "${tenantId}":`,
        error,
      );
    }
  }
}

async function reapTenants(): Promise<void> {
  await forEachTenant('REAP', async (tenantId, client) => {
    const {reaped, failed} = await reapExpiredUploads({client});
    console.log(
      `[UPLOAD][REAP] tenant "${tenantId}": reaped ${reaped}, failed ${failed}`,
    );
  });
}

async function pruneTenants(): Promise<void> {
  await forEachTenant('PRUNE', async (tenantId, client) => {
    const {pruned} = await pruneStaleUploads({client});
    console.log(`[UPLOAD][PRUNE] tenant "${tenantId}": pruned ${pruned}`);
  });
}

/**
 * Start the periodic cleanup. Idempotent — repeated calls (e.g. dev hot-reload)
 * are no-ops. Both passes run an initial catch-up shortly after startup, then
 * each on its own fixed cadence. Every timer is `unref`'d so none keeps the
 * process alive on its own.
 */
export function startStagedUploadReaper(): void {
  if (started) return;
  started = true;

  /*
   * forEachTenant already isolates per-tenant failures; the `.catch` guards the
   * discarded timer promise so a stray rejection can't surface as an unhandled
   * rejection and crash the process.
   */
  const runReap = () =>
    reapTenants().catch(error =>
      console.error('[UPLOAD][REAP] sweep crashed:', error),
    );
  const runPrune = () =>
    pruneTenants().catch(error =>
      console.error('[UPLOAD][PRUNE] sweep crashed:', error),
    );

  const timers = [
    setTimeout(runReap, INITIAL_SWEEP_DELAY_MS),
    setTimeout(runPrune, INITIAL_SWEEP_DELAY_MS),
    setInterval(runReap, REAP_INTERVAL_MS),
    setInterval(runPrune, PRUNE_INTERVAL_MS),
  ];
  for (const timer of timers) {
    timer.unref?.();
  }
}
