import 'server-only';

import type {Client} from '@/goovee/.generated/client';
import {parseReference} from './domain/reference';
import type {SignalResolution} from './domain/signal';
import type {Gateway} from './domain/types';

export type Resolved =
  | {kind: 'found'; paymentId: string}
  | {kind: 'not-found'}
  /** One of our references, minted by another tenant: acknowledged and never settled here. */
  | {kind: 'other-tenant'; tenantId: string}
  /** Not one of our references at all. */
  | {kind: 'not-ours'};

/**
 * Finds the payment a signal is about, always against a value already held:
 * our reference, or the session reference the provider handed us. Never a
 * retrieve.
 *
 * The tenant marker in the reference is checked here, so no handler can
 * forget it.
 */
export async function resolvePayment({
  resolution,
  gateway,
  tenantId,
  client,
}: {
  resolution: SignalResolution;
  /** Needed for a session reference, which is scoped by provider. */
  gateway?: Gateway;
  tenantId: string;
  client: Client;
}): Promise<Resolved> {
  if (resolution.by === 'sessionRef') {
    if (!gateway) {
      throw new Error('A session reference lookup needs the gateway');
    }
    const session = await client.aOSPortalPaymentSession.findOne({
      where: {gateway, sessionRef: resolution.sessionRef},
      select: {payment: {id: true}},
    });
    return session?.payment
      ? {kind: 'found', paymentId: session.payment.id}
      : {kind: 'not-found'};
  }
  const parsed = parseReference(resolution.reference);
  if (!parsed) {
    return {kind: 'not-ours'};
  }
  if (parsed.tenantId !== tenantId) {
    return {kind: 'other-tenant', tenantId: parsed.tenantId};
  }
  const payment = await client.aOSPortalPayment.findOne({
    where: {reference: parsed.reference},
    select: {id: true},
  });
  return payment ? {kind: 'found', paymentId: payment.id} : {kind: 'not-found'};
}

/** The reference of the payment a signal names, or null when it names none of ours. */
export async function referenceOf({
  resolution,
  gateway,
  tenantId,
  client,
}: {
  resolution: SignalResolution;
  gateway: Gateway;
  tenantId: string;
  client: Client;
}): Promise<string | null> {
  const resolved = await resolvePayment({
    resolution,
    gateway,
    tenantId,
    client,
  });
  if (resolved.kind !== 'found') {
    return null;
  }
  const payment = await client.aOSPortalPayment.findOne({
    where: {id: resolved.paymentId},
    select: {reference: true},
  });
  return payment?.reference ?? null;
}

/** Looks a payment up by the reference in a URL, applying the same tenant check as a signal. */
export async function resolveReference({
  reference,
  tenantId,
  client,
}: {
  reference: string;
  tenantId: string;
  client: Client;
}): Promise<Resolved> {
  return resolvePayment({
    resolution: {by: 'reference', reference},
    tenantId,
    client,
  });
}
