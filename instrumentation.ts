const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000];

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Schedule the staged-upload reaper (non-blocking — just arms timers).
  const {startStagedUploadReaper} = await import('@/lib/core/upload/startup');
  startStagedUploadReaper();

  /* Run after register() returns so it doesn't block server startup. The
   * database may not be reachable yet when this fires, so each tenant is
   * retried with backoff — and one failing tenant must not abort resumption
   * for the rest. */
  setTimeout(async () => {
    const [{manager}, {resumeHubPispPolling}] = await Promise.all([
      import('@/tenant'),
      import('@/lib/core/payment/hubpisp/startup'),
    ]);

    let tenantIds: string[];
    try {
      tenantIds = await manager.listTenantIds();
    } catch (err) {
      console.error('[HUBPISP][STARTUP] Could not list tenants:', err);
      return;
    }

    for (const tenantId of tenantIds) {
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
          await resumeHubPispPolling({tenantId});
          break;
        } catch {
          const delay = RETRY_DELAYS_MS[attempt];
          if (delay === undefined) {
            console.error(
              `[HUBPISP][STARTUP] All retry attempts exhausted for tenant "${tenantId}", giving up.`,
            );
            break;
          }
          console.warn(
            `[HUBPISP][STARTUP] Tenant "${tenantId}" not ready yet, retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length})`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  });
}
