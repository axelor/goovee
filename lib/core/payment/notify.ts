import 'server-only';

import type {Tenant} from '@/tenant';
import {minorUnitsOf} from './domain/money';
import {FULFILMENT_STATUS, PAYMENT_STATUS} from './domain/types';
import {readSnapshot} from './intent';
import {getSourceHandler} from './sources/registry';
import {readSubject} from './domain/subject';

/**
 * The `notify` task: runs a captured payment's confirmation through its
 * source. A payment that was never captured and delivered owes none.
 */
export async function notifyPayment({
  tenant,
  paymentId,
}: {
  tenant: Tenant;
  paymentId: string;
}): Promise<void> {
  const payment = await tenant.client.aOSPortalPayment.findOne({
    where: {id: paymentId},
    select: {
      reference: true,
      source: true,
      status: true,
      fulfilmentStatus: true,
      amount: true,
      currencyCode: true,
      currencyScale: true,
      payer: true,
      subjectLabel: true,
      portalWorkspace: {url: true},
      subjectModel: true,
      subjectId: true,
    },
  });
  if (!payment) {
    return;
  }
  if (
    payment.status !== PAYMENT_STATUS.captured ||
    payment.fulfilmentStatus !== FULFILMENT_STATUS.delivered
  ) {
    console.warn(
      `[PAYMENT][NOTIFY] payment ${payment.reference} is ${payment.status} / ${payment.fulfilmentStatus}; no confirmation sent`,
    );
    return;
  }
  const workspaceUrl = payment.portalWorkspace?.url;
  if (!workspaceUrl) {
    throw new Error(`Payment ${payment.reference} names no workspace address`);
  }

  const handler = getSourceHandler(
    payment.source as Parameters<typeof getSourceHandler>[0],
  );
  if (!handler.notify) {
    return;
  }

  const subject = readSubject(payment.subjectModel, payment.subjectId);

  await handler.notify({
    payment: {
      id: payment.id,
      reference: payment.reference,
      money: {
        amount: minorUnitsOf(payment.amount),
        currencyCode: payment.currencyCode,
        currencyScale: payment.currencyScale,
      },
      payer: payment.payer,
      subjectLabel: payment.subjectLabel,
      workspaceUrl,
    },
    subject,
    snapshot: await readSnapshot(tenant.client, payment.id),
    tenant,
  });
}
