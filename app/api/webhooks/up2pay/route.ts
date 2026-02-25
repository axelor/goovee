export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsFailed,
  markPaymentAsProcessed,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import {UP2PAY_ERRORS, UP2PAY_ERROR_MESSAGES} from '@/payment/up2pay/constants';
import {readPEMFile, verifySignature} from '@/payment/up2pay/crypto';
import {getParamsWithoutSign} from '@/payment/up2pay/utils';
import {decodeFilter as decode} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

export async function GET(request: Request) {
  console.log('===============================================');
  console.log('[UP2PAY][WEBHOOK] Incoming request', {
    method: request.method,
    url: request.url,
  });

  const parsed = new URL(request.url);
  const params = parsed.searchParams;

  const message = getParamsWithoutSign(parsed.search);
  const pem = readPEMFile();
  const sign = params.get('sign');
  const erreur = params.get('erreur');
  const ref = params.get('ref');
  const montant = params.get('montant');

  console.log('[UP2PAY][WEBHOOK] Parsed params', {
    hasMessage: !!message,
    hasPem: !!pem,
    hasSign: !!sign,
    erreur,
    ref,
    montant,
  });

  if (!(pem && message && sign && ref)) {
    console.error('[UP2PAY][WEBHOOK] Missing required parameters');
    return new NextResponse('Bad Request', {status: 400});
  }

  const isSignatureValid = verifySignature(message, sign, pem);
  console.log('[UP2PAY][WEBHOOK] Signature verification result', {
    isSignatureValid,
  });

  if (!isSignatureValid) {
    console.error('[UP2PAY][WEBHOOK] Invalid signature');
    return new NextResponse('Bad Request', {status: 400});
  }

  const decoded = decode(ref) as
    | {context_id?: string; tenant_id?: string; amount?: number}
    | undefined;
  const contextId = decoded?.context_id;
  const tenantId = decoded?.tenant_id;
  const expectedAmount = decoded?.amount;

  console.log('[UP2PAY][WEBHOOK] Extracted identifiers', {
    contextId,
    tenantId,
    expectedAmount,
  });

  if (!(contextId && tenantId && expectedAmount)) {
    console.error('[UP2PAY][WEBHOOK] Invalid ref format');
    return new NextResponse('Bad Request', {status: 400});
  }

  const paymentContext = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.up2pay,
    ignoreExpiration: true,
  });

  if (!paymentContext) {
    console.error('[UP2PAY][WEBHOOK] Payment context not found', {
      contextId,
      tenantId,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  console.log('[UP2PAY][WEBHOOK] Payment context loaded', {
    status: paymentContext.status,
    version: paymentContext.version,
  });

  if (paymentContext.status === CONTEXT_STATUS.processed) {
    console.log('[UP2PAY][WEBHOOK] Context already processed, skipping', {
      contextId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (erreur !== UP2PAY_ERRORS.CODE_ERROR_OPERATION_SUCCESSFUL) {
    const errorMessage = erreur
      ? (UP2PAY_ERROR_MESSAGES[erreur] ??
        `Payment refused by authorization center (${erreur})`)
      : 'Missing error code';

    console.warn('[UP2PAY][WEBHOOK] Payment failed at gateway', {
      erreur,
      errorMessage,
      contextId,
    });

    if (erreur === UP2PAY_ERRORS.CODE_ERROR_PENDING_ISSUER_VALIDATION) {
      // Payment is pending issuer validation — do not mark as failed yet
      return new NextResponse('OK', {status: 200});
    }

    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });

    return new NextResponse('OK', {status: 200});
  }

  const paidAmount = montant
    ? Number(montant) / 100
    : paymentContext.data?.amount;
  console.log('paidAmount >>>', paidAmount);
  if (paidAmount !== expectedAmount) {
    console.error('[UP2PAY][WEBHOOK] Amount mismatch', {
      expected: expectedAmount,
      received: paidAmount,
      contextId,
    });

    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });

    return new NextResponse('Bad Request', {status: 400});
  }

  const invoiceId = paymentContext.data?.id;

  console.log('[UP2PAY][WEBHOOK] Payment successful', {
    paidAmount,
    invoiceId,
  });

  if (!invoiceId) {
    console.error('[UP2PAY][WEBHOOK] Missing invoice id in payment context', {
      contextId,
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
    invoiceId,
  });

  if (result?.error) {
    console.error('[UP2PAY][WEBHOOK] Invoice update failed', {
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

  console.log('[UP2PAY][WEBHOOK] Invoice updated successfully', {
    invoiceId,
  });

  await markPaymentAsProcessed({
    contextId: paymentContext.id,
    version: paymentContext.version,
    tenantId,
  });

  console.log('[UP2PAY][WEBHOOK] Payment marked as processed', {
    contextId,
  });

  return new NextResponse('OK', {status: 200});
}
