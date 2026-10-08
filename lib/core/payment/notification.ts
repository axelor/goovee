import 'server-only';

import {NextResponse, after} from 'next/server';

import {manager} from '@/tenant';
import {RequestBodyTooLarge, readTextWithin} from '@/security/request-body';
import {getAdapter} from './adapters/registry';
import type {Gateway} from './domain/types';
import {runPaymentTasks} from './tasks';
import {triggerRegistration} from './register';
import {settlePayment} from './settle';

/** Largest notification body a webhook route will hold in memory. */
const MAX_NOTIFICATION_BYTES = 1024 * 1024;

/**
 * One handler behind every webhook route. Reads the notification through the
 * gateway's adapter, settles each financial event it carries, and answers 200
 * for anything that was understood, whether it changed something or not, so
 * the provider stops redelivering. A notification that cannot be verified is
 * refused with 400 and left to the provider's retry.
 */
export async function handleNotification({
  request,
  gateway,
  tenantId,
}: {
  request: Request;
  gateway: Gateway;
  tenantId: string | null;
}): Promise<NextResponse> {
  const tenant = tenantId ? await manager.getTenant(tenantId) : null;
  if (!tenant) {
    return new NextResponse('Not Found', {status: 404});
  }

  const adapter = getAdapter(gateway);

  /* A notification with a body is read within a size limit and handed on
   * with that body; one without, the Verifone family's GET with everything in
   * the query, goes to the adapter as it arrived. */
  let bounded = request;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    let body: string;
    try {
      body = await readTextWithin(request, MAX_NOTIFICATION_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLarge) {
        return new NextResponse('Payload Too Large', {status: 413});
      }
      throw error;
    }
    bounded = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });
  }

  let signals;
  try {
    signals = await adapter.parseNotification(bounded, {
      tenantId: tenant.id,
      config: tenant.config,
    });
  } catch (error) {
    console.warn(
      `${gateway} notification refused for tenant ${tenant.id}:`,
      error,
    );
    return new NextResponse('Bad Request', {status: 400});
  }

  const outcomes = [];
  for (const signal of signals) {
    const outcome = await settlePayment({signal, tenant});
    outcomes.push(outcome.outcome);
    if (outcome.outcome === 'settled' && outcome.registrationQueued) {
      const reference = outcome.reference;
      after(() => triggerRegistration({tenant, reference}));
    }
    if (outcome.outcome === 'settled' && outcome.gooveeTasksQueued) {
      const {paymentId} = outcome;
      after(() => runPaymentTasks({tenant, paymentId}));
    }
    if (outcome.outcome === 'rejected') {
      console.warn(
        `${gateway} notification for tenant ${tenant.id} named no payment of ours (${outcome.reason})`,
      );
    }
  }

  return NextResponse.json({received: signals.length, outcomes});
}
