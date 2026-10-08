import 'server-only';

import {aosClient} from '@/service/aos';
import type {Tenant} from '@/tenant';

/** How long a caller that wants the page complete on first paint waits for AOS. */
export const REGISTRATION_WAIT_MS = 4000;

/**
 * Asks AOS to run a payment's registration task now. Best effort and for latency
 * only: the task row is already committed, so a call that fails or times out
 * changes nothing except how soon the result page reads "complete". Nothing
 * runs the row again on its own: it waits under Payments to resolve for a
 * person's Register payment, which runs it through the same service.
 */
export async function triggerRegistration({
  tenant,
  reference,
  timeoutMs = REGISTRATION_WAIT_MS,
}: {
  tenant: Tenant;
  reference: string;
  timeoutMs?: number;
}): Promise<void> {
  try {
    await aosClient(tenant.config.aos).request('ws/portal/payments/register', {
      body: {reference},
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    console.warn(
      `Payment ${reference}: registration not run by AOS yet (${
        error instanceof Error ? error.message : String(error)
      })`,
    );
  }
}
