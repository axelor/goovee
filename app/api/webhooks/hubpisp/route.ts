export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsExpired,
  markPaymentAsFailed,
  markPaymentAsProcessed,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import {notifyPaymentUpdate} from '@/lib/core/payment/sse';
import {syncPaymentLinkStatus} from '@/lib/core/payment/hubpisp';
import {
  HUBPISP_TERMINAL_FAILURE_STATUSES,
  HUBPISP_TERMINAL_SUCCESS_STATUSES,
} from '@/lib/core/payment/hubpisp/constants';
import {fetchPaymentRequestStatus} from '@/lib/core/payment/hubpisp/paymentRequest';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

async function triggerPaymentProcessing({
  paymentContext,
  transactionStatus,
  tenantId,
}: {
  paymentContext: any;
  transactionStatus: string;
  tenantId: string;
}): Promise<NextResponse> {
  if (HUBPISP_TERMINAL_FAILURE_STATUSES.includes(transactionStatus as any)) {
    console.warn(
      '[HUBPISP][WEBHOOK] Terminal failure status, marking as failed',
      {
        contextId: paymentContext.id,
        transactionStatus,
      },
    );
    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (!HUBPISP_TERMINAL_SUCCESS_STATUSES.includes(transactionStatus as any)) {
    return new NextResponse('OK', {status: 200});
  }

  // Terminal success: update the invoice
  const invoiceId = paymentContext.data?.id;
  const paidAmount = paymentContext.data?.amount;

  if (!(invoiceId && paidAmount)) {
    console.error(
      '[HUBPISP][WEBHOOK] Missing invoice id or amount in context',
      {
        contextId: paymentContext.id,
      },
    );
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
    invoiceId,
  });

  if (result?.error) {
    console.error('[HUBPISP][WEBHOOK] Invoice update failed', {
      invoiceId,
      error: result.error,
    });
    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('Internal Server Error', {status: 500});
  }

  await markPaymentAsProcessed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    tenantId,
  });

  const source = paymentContext.data?.source;
  if (source) {
    notifyPaymentUpdate(source, invoiceId);
  } else {
    console.warn(
      '[HUBPISP][WEBHOOK] No source in context data, SSE notification skipped',
      {
        contextId: paymentContext.id,
      },
    );
  }

  return new NextResponse('OK', {status: 200});
}

export async function POST(request: Request) {
  const resourceId = request.headers.get('ResourceID');
  const parsed = new URL(request.url);
  const contextId = parsed.searchParams.get('contextId');
  const tenantId = parsed.searchParams.get('tenantId');

  if (!(resourceId && contextId && tenantId)) {
    console.error('[HUBPISP][WEBHOOK] Missing required parameters');
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
    return new NextResponse('OK', {status: 200});
  }

  // Sync the payment link status — returns null if not yet PROCESSED, throws if EXPIRED
  let linkStatus: any;
  try {
    linkStatus = await syncPaymentLinkStatus(resourceId);
  } catch (err) {
    // Link has EXPIRED
    console.warn('[HUBPISP][WEBHOOK] Payment link expired', {
      resourceId,
      error: (err as Error).message,
    });
    await markPaymentAsExpired({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (!linkStatus) {
    return new NextResponse('OK', {status: 200});
  }

  const paymentRequestResourceId = linkStatus?.paymentRequestResourceId;
  if (!paymentRequestResourceId) {
    console.error('[HUBPISP][WEBHOOK] Missing paymentRequestResourceId', {
      contextId,
    });
    return new NextResponse('OK', {status: 200});
  }

  // Fetch the payment request status to check if the transfer succeeded
  let paymentRequest: any;
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
    tenantId,
  });
}
