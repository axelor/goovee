export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsExpired,
  updatePaymentContextData,
} from '@/lib/core/payment/common/orm';
import {fetchPaymentLinkStatus} from '@/lib/core/payment/hubpisp';
import {HUBPISP_CONSENT_STATUS} from '@/lib/core/payment/hubpisp/constants';
import {fetchPaymentRequestStatus} from '@/lib/core/payment/hubpisp/paymentRequest';
import {pollPaymentRequestStatus} from '@/lib/core/payment/hubpisp/poll';
import {applyTransactionStatus} from '@/lib/core/payment/hubpisp/process';
import type {
  PaymentLinkStatusResult,
  PaymentRequestStatusResult,
} from '@/lib/core/payment/hubpisp/types';
import {PaymentOption} from '@/types';
import type {HubPispLocalInstrument} from '@/lib/core/payment/hubpisp/constants';

export async function POST(
  _request: Request,
  {params}: {params: Promise<{resourceId: string}>},
) {
  const {resourceId} = await params;

  let linkData: PaymentLinkStatusResult;
  try {
    linkData = await fetchPaymentLinkStatus(resourceId);
  } catch (err) {
    console.error('[HUBPISP][WEBHOOK] Failed to fetch payment link', {
      resourceId,
      error: (err as Error).message,
    });
    return new NextResponse('Internal Server Error', {status: 500});
  }

  const endToEnd = linkData.paymentDetails?.endToEnd;
  if (!endToEnd) {
    console.error('[HUBPISP][WEBHOOK] Missing endToEnd in payment link', {
      resourceId,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  const separatorIndex = endToEnd.indexOf('-');
  if (separatorIndex === -1) {
    console.error('[HUBPISP][WEBHOOK] Invalid endToEnd format', {endToEnd});
    return new NextResponse('Bad Request', {status: 400});
  }

  const contextId = endToEnd.slice(0, separatorIndex);
  const tenantId = endToEnd.slice(separatorIndex + 1);

  if (!contextId || !tenantId) {
    console.error('[HUBPISP][WEBHOOK] Failed to parse endToEnd', {endToEnd});
    return new NextResponse('Bad Request', {status: 400});
  }

  const paymentContext = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.hubpisp,
    ignoreExpiration: true,
  });

  if (!paymentContext) {
    console.error('[HUBPISP][WEBHOOK] Payment context not found', {
      contextId,
      tenantId,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  if (
    paymentContext.status === CONTEXT_STATUS.processed ||
    paymentContext.data?.paymentRequestResourceId
  ) {
    console.log('[HUBPISP][WEBHOOK] Context already handled, skipping', {
      contextId: paymentContext.id,
    });
    return new NextResponse('OK', {status: 200});
  }

  const consentStatus = linkData.consentStatus;
  if (consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][WEBHOOK] Payment link expired', {resourceId});
    await markPaymentAsExpired({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
    console.log('[HUBPISP][WEBHOOK] Payment link not yet processed, waiting');
    return new NextResponse('OK', {status: 200});
  }

  const paymentRequestResourceId = linkData.paymentRequestResourceId;
  if (!paymentRequestResourceId) {
    console.error('[HUBPISP][WEBHOOK] Missing paymentRequestResourceId', {
      contextId: paymentContext.id,
    });
    return new NextResponse('OK', {status: 200});
  }

  // Persist paymentRequestResourceId so startup polling can resume it after a server restart.
  await updatePaymentContextData({
    id: paymentContext.id,
    version: paymentContext.version,
    tenantId,
    context: {...paymentContext.data, paymentRequestResourceId},
  });

  const localInstrument = paymentContext.data?.localInstrument as
    | HubPispLocalInstrument
    | undefined;

  let paymentRequest: PaymentRequestStatusResult;
  try {
    paymentRequest = await fetchPaymentRequestStatus(paymentRequestResourceId);
  } catch (err) {
    console.error('[HUBPISP][WEBHOOK] Failed to fetch payment request status', {
      paymentRequestResourceId,
      error: (err as Error).message,
    });
    return new NextResponse('Internal Server Error', {status: 500});
  }

  const transactionStatus =
    paymentRequest?.creditTransferTransaction?.[0]?.transactionStatus ||
    paymentRequest?.transactionStatus;

  const statusReasonInformation = (paymentRequest
    ?.creditTransferTransaction?.[0]?.statusReasonInformation ||
    paymentRequest?.statusReasonInformation) as string | undefined;

  if (!transactionStatus) {
    console.log(
      '[HUBPISP][WEBHOOK] Missing transactionStatus, starting background poll',
      {paymentRequestResourceId},
    );
    pollPaymentRequestStatus({
      paymentRequestResourceId,
      contextId: paymentContext.id,
      tenantId,
      localInstrument,
    });
    return new NextResponse('OK', {status: 200});
  }

  const isTerminal = await applyTransactionStatus({
    paymentContext,
    transactionStatus,
    statusReasonInformation,
    tenantId,
  });

  if (!isTerminal) {
    console.log(
      '[HUBPISP][WEBHOOK] Non-terminal status, starting background poll',
      {contextId: paymentContext.id, transactionStatus},
    );
    pollPaymentRequestStatus({
      paymentRequestResourceId,
      contextId: paymentContext.id,
      tenantId,
      localInstrument,
    });
  }

  return new NextResponse('OK', {status: 200});
}
