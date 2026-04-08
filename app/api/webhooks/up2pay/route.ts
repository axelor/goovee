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
import {notifyPaymentUpdate} from '@/lib/core/payment/sse';
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';

// ---- LOCAL IMPORTS ---- //
import {updateInvoice} from '@/subapps/invoices/common/service';

/**
 * Fire-and-forget forward of the IPN to the legacy ERP.
 * Only called when Goovee cannot process the IPN (unrecognized ref format or unknown payment context).
 * Controlled by UP2PAY_LEGACY_FORWARD_URL — if not set, no forwarding occurs.
 */
function forwardToLegacy(request: Request): void {
  const legacyUrl = process.env.UP2PAY_LEGACY_FORWARD_URL;
  if (!legacyUrl) return;

  const params = new URL(request.url).searchParams;
  const forwardUrl = `${legacyUrl}?${params.toString()}`;

  fetch(forwardUrl, {method: 'GET'})
    .then(res =>
      console.log('[UP2PAY][WEBHOOK] Forwarded to legacy ERP', {
        status: res.status,
        forwardUrl,
      }),
    )
    .catch(err =>
      console.error('[UP2PAY][WEBHOOK] Legacy forward failed', {error: err}),
    );
}

export async function GET(request: Request) {
  const parsed = new URL(request.url);
  const params = parsed.searchParams;

  const SIGNED_PARAMS = ['montant', 'ref', 'erreur'];
  const message = SIGNED_PARAMS.filter(key => params.has(key))
    .map(
      key =>
        `${key}=${encodeURIComponent(params.get(key)!).replace(/%7E/gi, '~')}`,
    )
    .join('&');

  const pem = readPEMFile();

  const sign = params.get('sign')?.trim();

  const erreur = params.get('erreur');

  const ref = params.get('ref');

  const montant = params.get('montant');

  if (!(pem && message && sign && ref)) {
    console.error('[UP2PAY][WEBHOOK] Missing required params', {
      hasPem: !!pem,
      hasMessage: !!message,
      hasSign: !!sign,
      hasRef: !!ref,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  const isSignatureValid = verifySignature(message, sign, pem);

  if (!isSignatureValid) {
    console.error('[UP2PAY][WEBHOOK] Invalid signature', {ref, sign});
    return new NextResponse('Bad Request', {status: 400});
  }

  // contextId and tenantId are encoded in ref as: name-sequence~contextId~tenantId
  const tildeIndex = ref.indexOf('~');
  const tildeParts =
    tildeIndex !== -1 ? ref.slice(tildeIndex + 1).split('~') : [];
  const contextId = tildeParts.length === 2 ? tildeParts[0] : null;
  const tenantId = tildeParts.length === 2 ? tildeParts[1] : null;

  if (!(contextId && tenantId)) {
    // Ref does not match Goovee format — likely a legacy invoice, forward to legacy ERP.
    console.error(
      '[UP2PAY][WEBHOOK] Ref does not match Goovee format, forwarding to legacy',
      {ref},
    );
    forwardToLegacy(request);
    return new NextResponse('OK', {status: 200});
  }

  const paymentContext = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.up2pay,
    ignoreExpiration: true,
  });

  if (!paymentContext) {
    // Payment context not found — forward to legacy ERP.
    console.error(
      '[UP2PAY][WEBHOOK] Payment context not found, forwarding to legacy',
      {
        contextId,
        tenantId,
      },
    );
    forwardToLegacy(request);
    return new NextResponse('OK', {status: 200});
  }

  if (paymentContext.status === CONTEXT_STATUS.processed) {
    console.log('[UP2PAY][WEBHOOK] Already processed, skipping', {contextId});
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

  const expectedAmount = paymentContext.data?.amount;
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
        paymentModeId: paymentContext.data?.paymentModeId,
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
  notifyPaymentUpdate(source, entityId, paymentContext.id);

  return new NextResponse('OK', {status: 200});
}
