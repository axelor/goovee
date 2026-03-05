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
import {notifyPaymentUpdate} from '@/lib/core/payment/sse';
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

export async function GET(request: Request) {
  const parsed = new URL(request.url);
  const params = parsed.searchParams;

  const message = decodeURIComponent(getParamsWithoutSign(parsed.search));
  const pem = readPEMFile();
  const sign = params.get('sign');
  const erreur = params.get('erreur');
  const ref = params.get('ref');
  const montant = params.get('montant');

  if (!(pem && message && sign && ref)) {
    return new NextResponse('Bad Request', {status: 400});
  }

  const isSignatureValid = verifySignature(message, sign, pem);

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

  if (paymentContext.status === CONTEXT_STATUS.processed) {
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

  const source = paymentContext.data?.source;
  if (!source) {
    console.error(
      '[UP2PAY][WEBHOOK] Missing payment source in payment context',
      {
        contextId,
      },
    );

    await markPaymentAsFailed({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });

    return new NextResponse('Bad Request', {status: 400});
  }

  const entityId = paymentContext.data?.id;
  if (!entityId) {
    console.error('[UP2PAY][WEBHOOK] Missing entity id in payment context', {
      contextId,
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
      const result = await updateInvoice({
        tenantId,
        amount: paidAmount,
        invoiceId: entityId,
      });

      if (result?.error) {
        console.error('[UP2PAY][WEBHOOK] Invoice update failed', {
          entityId,
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
      console.warn('[UP2PAY][WEBHOOK] Source not implemented:', source);
      return new NextResponse('OK', {status: 200});

    default:
      console.error('[UP2PAY][WEBHOOK] Unknown payment source:', source);

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
