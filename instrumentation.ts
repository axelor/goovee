import {DEFAULT_TENANT} from '@/constants';

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000];

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Run after register() returns so it doesn't block server startup.
  // In multi-tenant mode, MultiTenantManager fetches tenant config via HTTP
  // on itself (/api/tenant/:id/config), which fails if called before the
  // server is ready. We retry with backoff instead of a fixed delay.
  setTimeout(async () => {
    const {resumeHubPispPolling} = await import(
      '@/lib/core/payment/hubpisp/startup'
    );

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        await resumeHubPispPolling({tenantId: DEFAULT_TENANT});
        return;
      } catch {
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) {
          console.error(
            '[HUBPISP][STARTUP] All retry attempts exhausted, giving up.',
          );
          return;
        }
        console.warn(
          `[HUBPISP][STARTUP] Server not ready yet, retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length})`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  });
}
