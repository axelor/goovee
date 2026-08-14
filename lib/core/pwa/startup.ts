// ---- CORE IMPORTS ---- //
import {listTenantConfigsSync} from '@/tenant/config-provider';

// ---- LOCAL IMPORTS ---- //
import {getMaxConnections, getVapidDetails} from './utils';

/**
 * Report at startup which tenants can send push notifications — nothing else in
 * the portal surfaces a missing key, because a notification is stored and shown
 * in the portal whether or not it reaches a device.
 *
 * Reported per tenant, since the signing identity is per tenant: a deployment
 * where one tenant is configured and another is not has to say so about both, or
 * the tenant that is silent looks the same as the tenant that is working.
 */
export function checkPushConfig(): void {
  /* Reporting must not be what stops the server starting. Reading the document
   * throws when it is missing or malformed, and the rest of `register()` — the
   * upload sweeps, the payment resumption — has no reason to be lost to that. */
  try {
    report();
  } catch (error) {
    console.error('[PUSH][STARTUP] could not read the configuration:', error);
  }
}

function report(): void {
  const tenants = listTenantConfigsSync();

  /* getVapidDetails reports per tenant why a configuration is unusable, so this
   * only has to count what came back. */
  const configured = tenants.filter(([tenantId, config]) =>
    Boolean(getVapidDetails(tenantId, config)),
  );

  if (!configured.length) {
    return;
  }

  const names = configured.map(([tenantId]) => tenantId).join(', ');

  console.log(
    `[PUSH][STARTUP] push notifications are configured for ${names}; up to ` +
      `${getMaxConnections()} notifications are delivered at once ` +
      `(set $global.pushMaxConnections to change)`,
  );
}
