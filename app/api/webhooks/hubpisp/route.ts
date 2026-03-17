export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsCancelled,
  markPaymentAsExpired,
  markPaymentAsFailed,
  markPaymentAsProcessed,
} from '@/lib/core/payment/common/orm';
import {notifyPaymentUpdate} from '@/lib/core/payment/sse';
import {
  fetchPaymentLinkStatus,
  getPaymentLinkStatus,
} from '@/lib/core/payment/hubpisp';
import {
  HUBPISP_CONSENT_STATUS,
  HUBPISP_TRANSACTION_STATUS,
} from '@/lib/core/payment/hubpisp/constants';
import {fetchPaymentRequestStatus} from '@/lib/core/payment/hubpisp/paymentRequest';
import type {
  PaymentLinkStatusResult,
  PaymentRequestStatusResult,
} from '@/lib/core/payment/hubpisp/types';
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';
import type {PaymentContext} from '@/lib/core/payment/common/type';
import {PaymentOption} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

async function triggerPaymentProcessing({
  paymentContext,
  transactionStatus,
  statusReasonInformation,
  tenantId,
}: {
  paymentContext: PaymentContext;
  transactionStatus: string;
  statusReasonInformation?: string;
  tenantId: string;
}): Promise<NextResponse> {
  switch (transactionStatus) {
    case HUBPISP_TRANSACTION_STATUS.CANC:
      console.warn('[HUBPISP][WEBHOOK] Payment cancelled by user', {
        contextId: paymentContext.id,
        transactionStatus,
        statusReasonInformation,
      });
      await markPaymentAsCancelled({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      notifyPaymentUpdate(
        paymentContext.data.source,
        paymentContext.data.id,
        'cancelled',
      );
      return new NextResponse('OK', {status: 200});

    case HUBPISP_TRANSACTION_STATUS.RJCT:
      console.warn('[HUBPISP][WEBHOOK] Payment rejected', {
        contextId: paymentContext.id,
        transactionStatus,
        statusReasonInformation,
      });
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      notifyPaymentUpdate(
        paymentContext.data.source,
        paymentContext.data.id,
        'failed',
      );
      return new NextResponse('OK', {status: 200});

    case HUBPISP_TRANSACTION_STATUS.ACSC:
      break;

    default:
      console.log(
        '[HUBPISP][WEBHOOK] Non-terminal status, waiting for next webhook',
        {
          contextId: paymentContext.id,
          transactionStatus,
        },
      );
      return new NextResponse('OK', {status: 200});
  }

  const source = paymentContext.data?.source;
  const entityId = paymentContext.data?.id;
  const paidAmount = paymentContext.data?.amount;

  if (!source) {
    console.error(
      '[HUBPISP][WEBHOOK] Missing payment source in payment context',
      {contextId: paymentContext.id},
    );
    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  if (!entityId) {
    console.error('[HUBPISP][WEBHOOK] Missing entity id in payment context', {
      contextId: paymentContext.id,
    });
    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  switch (source) {
    case PAYMENT_SOURCE.INVOICES: {
      if (!paidAmount) {
        console.error('[HUBPISP][WEBHOOK] Missing amount in context', {
          contextId: paymentContext.id,
        });
        await markPaymentAsFailed({
          contextId: paymentContext.id,
          version: paymentContext.version,
          tenantId,
        });
        return new NextResponse('Bad Request', {status: 400});
      }

      const result = await updateInvoice({
        tenantId,
        amount: paidAmount,
        invoiceId: entityId,
      });

      if (result?.error) {
        console.error('[HUBPISP][WEBHOOK] Invoice update failed', {
          invoiceId: entityId,
          error: result.error,
        });
        await markPaymentAsFailed({
          contextId: paymentContext.id,
          version: paymentContext.version,
          tenantId,
        });
        return new NextResponse('Internal Server Error', {status: 500});
      }

      break;
    }

    case PAYMENT_SOURCE.SHOP:
    case PAYMENT_SOURCE.EVENTS:
      console.warn('[HUBPISP][WEBHOOK] Source not implemented:', source);
      return new NextResponse('OK', {status: 200});

    default:
      console.error('[HUBPISP][WEBHOOK] Unknown payment source:', source);
      await markPaymentAsFailed({
        contextId: paymentContext.id,
        version: paymentContext.version,
        tenantId,
      });
      return new NextResponse('Bad Request', {status: 400});
  }

  await markPaymentAsProcessed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    tenantId,
  });

  notifyPaymentUpdate(source, entityId);

  return new NextResponse('OK', {status: 200});
}

export async function POST(request: Request) {
  const resourceId = request.headers.get('ResourceID');

  if (!resourceId) {
    console.error('[HUBPISP][WEBHOOK] Missing ResourceID header');
    return new NextResponse('Bad Request', {status: 400});
  }

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

  if (paymentContext.status === CONTEXT_STATUS.processed) {
    console.log('[HUBPISP][WEBHOOK] Context already processed, skipping', {
      contextId: paymentContext.id,
    });
    return new NextResponse('OK', {status: 200});
  }

  const linkStatusResult = await getPaymentLinkStatus(resourceId);

  if (linkStatusResult.consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][WEBHOOK] Payment link expired', {resourceId});
    await markPaymentAsExpired({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (linkStatusResult.consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
    console.log('[HUBPISP][WEBHOOK] Payment link not yet processed, waiting');
    return new NextResponse('OK', {status: 200});
  }

  const linkStatus = linkStatusResult.data;
  const paymentRequestResourceId = linkStatus.paymentRequestResourceId;
  if (!paymentRequestResourceId) {
    console.error('[HUBPISP][WEBHOOK] Missing paymentRequestResourceId', {
      contextId: paymentContext.id,
    });
    return new NextResponse('OK', {status: 200});
  }

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
    console.error(
      '[HUBPISP][WEBHOOK] Missing transactionStatus in payment request',
      {
        paymentRequestResourceId,
      },
    );
    return new NextResponse('OK', {status: 200});
  }

  return triggerPaymentProcessing({
    paymentContext,
    transactionStatus,
    statusReasonInformation,
    tenantId,
  });
}
