import 'server-only';

import {manager} from '@/tenant';
import {listTenantIds} from '@/tenant/config';
import {runPaymentTasks} from './tasks';

/* A capture's own request runs its tasks straight away; this is what runs the
 * ones that request never got to — the process stopped, the provider was
 * down — so how often it ticks bounds how long a transfer the invoice no
 * longer needs can stay open. */
const TICK_MS = 60 * 1000;
const FIRST_TICK_MS = 30 * 1000;

let started = false;

async function runForEveryTenant(): Promise<void> {
  let tenantIds: string[];
  try {
    tenantIds = listTenantIds();
  } catch (error) {
    console.error('[PAYMENT][TASK] could not list tenants:', error);
    return;
  }
  for (const tenantId of tenantIds) {
    try {
      const tenant = await manager.getTenant(tenantId);
      if (!tenant) continue;
      const {completed, failed} = await runPaymentTasks({tenant});
      if (completed || failed) {
        console.log(
          `[PAYMENT][TASK] tenant "${tenantId}": completed ${completed}, failed ${failed}`,
        );
      }
    } catch (error) {
      console.error(`[PAYMENT][TASK] failed for tenant "${tenantId}":`, error);
    }
  }
}

/**
 * Starts the clock for goovee's payment tasks. Idempotent, so a dev hot-reload
 * does not start a second one. Safe on several instances: tasks are claimed
 * with SKIP LOCKED and taken again before each runs, so two ticks never run
 * the same task.
 */
export function startPaymentTasks(): void {
  if (started) return;
  started = true;

  /* A tick that outlasts the interval is not joined by the next one: they
   * would claim from the same queue and step on each other's leases. */
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runForEveryTenant();
    } catch (error) {
      console.error('[PAYMENT][TASK] tick crashed:', error);
    } finally {
      running = false;
    }
  };
  const timers = [setTimeout(tick, FIRST_TICK_MS), setInterval(tick, TICK_MS)];
  for (const timer of timers) {
    timer.unref?.();
  }
}
