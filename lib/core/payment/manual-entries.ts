import 'server-only';

import type {Tenant} from '@/tenant';
import {minorUnitsOf} from './domain/money';
import {eventIdOf, type GatewaySignal} from './domain/signal';
import {RECEIVED_VIA, type EventType, type Gateway} from './domain/types';
import {triggerRegistration} from './register';
import {settlePayment} from './settle';

/*
 * The `apply_recorded` task: what a person entered by hand in the ERP — a
 * capture seen in a back office, or a cancellation — turned
 * into the same signal the provider's own notification would have been and
 * settled like one. Nothing downstream tells the two apart: the ledger event,
 * the status, the delivery, the registration and the confirmation all follow.
 */

const MANUAL_ENTRY_STATUS = {
  pending: 'pending',
  applied: 'applied',
  rejected: 'rejected',
} as const;

/** Applies every pending entry of a payment, oldest first. */
export async function applyManualEntries({
  tenant,
  paymentId,
}: {
  tenant: Tenant;
  paymentId: string;
}): Promise<void> {
  const {client} = tenant;
  const entries = await client.aOSPortalPaymentManualEntry.find({
    where: {payment: {id: paymentId}, status: MANUAL_ENTRY_STATUS.pending},
    select: {
      type: true,
      amount: true,
      occurredOn: true,
      providerRef: true,
      reason: true,
      eventKey: true,
      gateway: true,
      payment: {reference: true, currencyCode: true},
    },
    orderBy: {id: 'ASC'},
  });

  for (const entry of entries) {
    /* The ERP takes only a capture or a cancellation by hand. */
    const type = entry.type as EventType;
    const signal: GatewaySignal = {
      gateway: entry.gateway as Gateway,
      /* By the payment's own reference: the person entered it on this
       * payment, so there is nothing to resolve. */
      resolution: {by: 'reference', reference: entry.payment.reference},
      type,
      /* The ERP keyed the entry by the same rule, so its id is recovered from
       * the key and settle makes the key again, unchanged. */
      eventId: eventIdOf(type, entry.eventKey),
      amount: entry.amount == null ? null : minorUnitsOf(entry.amount),
      currencyCode: entry.amount == null ? null : entry.payment.currencyCode,
      providerRef: entry.providerRef,
      sessionRef: null,
      reason: entry.reason,
      receivedVia: RECEIVED_VIA.admin,
      receivedOn: entry.occurredOn ?? new Date(),
      payload: {source: 'admin', recordedEventId: entry.id},
    };

    const outcome = await settlePayment({signal, tenant});

    /* The key a reference makes is the provider's own, so a reference that
     * names another payment's event finds that payment's row and changes
     * nothing here; applying it would say the money moved when it did not. */
    if (
      outcome.outcome === 'duplicate' &&
      outcome.recordedOn !== entry.payment.reference
    ) {
      await client.aOSPortalPaymentManualEntry.update({
        data: {
          id: entry.id,
          version: entry.version,
          status: MANUAL_ENTRY_STATUS.rejected,
          error: `This reference is already recorded on payment ${outcome.recordedOn}; nothing was applied to this one. Check the reference.`,
        },
        select: {id: true},
      });
      continue;
    }

    if (outcome.outcome === 'settled' || outcome.outcome === 'duplicate') {
      await client.aOSPortalPaymentManualEntry.update({
        data: {
          id: entry.id,
          version: entry.version,
          status: MANUAL_ENTRY_STATUS.applied,
          appliedOn: new Date(),
          error: null,
        },
        select: {id: true},
      });
      if (outcome.outcome === 'settled' && outcome.registrationQueued) {
        await triggerRegistration({tenant, reference: outcome.reference});
      }
      continue;
    }

    /* Nothing a retry could change: the entry names no payment of ours. */
    await client.aOSPortalPaymentManualEntry.update({
      data: {
        id: entry.id,
        version: entry.version,
        status: MANUAL_ENTRY_STATUS.rejected,
        error: `Could not be applied: ${outcome.outcome}${'reason' in outcome ? ` (${outcome.reason})` : ''}`,
      },
      select: {id: true},
    });
  }
}
