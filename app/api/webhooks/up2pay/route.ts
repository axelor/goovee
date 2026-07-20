export const dynamic = 'force-dynamic';

import {NextResponse, after} from 'next/server';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {
  CONTEXT_STATUS,
  findPaymentContext,
  markPaymentAsFailed,
} from '@/lib/core/payment/common/orm';
import {PaymentOption} from '@/types';
import {UP2PAY_ERRORS, UP2PAY_ERROR_MESSAGES} from '@/payment/up2pay/constants';
import {readPEMFile, verifySignature} from '@/payment/up2pay/crypto';
import {completePayment} from '@/lib/core/payment/saga';
import {SAGA_OUTCOME_STATUS} from '@/lib/core/saga';
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';
import {buildSignatureMessage} from '@/payment/up2pay/utils';

// ---- LOCAL IMPORTS ---- //
import {notifyInvoicePaymentSuccess} from '@/subapps/invoices/common/utils/notify';

/**
 * Fire-and-forget forward of the IPN to the legacy ERP.
 * Only called when Goovee cannot process the IPN (unrecognized ref format or unknown payment context).
 * Controlled by UP2PAY_LEGACY_FORWARD_URL — if not set, no forwarding occurs.
 */
function forwardToLegacy(request: Request): boolean {
  const legacyUrl = process.env.UP2PAY_LEGACY_FORWARD_URL;
  if (!legacyUrl) return false;

  // Use the raw search string to preserve the original encoding (e.g. literal '+' in ref values),
  // so the legacy ERP receives exactly what Up2Pay sent and can verify its own signature.
  const forwardUrl = `${legacyUrl}${new URL(request.url).search}`;

  after(async () => {
    try {
      const res = await fetch(forwardUrl, {method: 'GET'});
      console.log('[UP2PAY][WEBHOOK] Forwarded to legacy ERP', {
        status: res.status,
        forwardUrl,
      });
    } catch (err) {
      console.error('[UP2PAY][WEBHOOK] Legacy forward failed', {error: err});
    }
  });

  return true;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const message = buildSignatureMessage(params);

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
      message,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  const isSignatureValid = verifySignature(message, sign, pem);

  if (!isSignatureValid) {
    console.error('[UP2PAY][WEBHOOK] Invalid signature', {
      ref,
      message,
      rawQuery: url.search.slice(1),
      sign,
    });
    return new NextResponse('Bad Request', {status: 400});
  }

  // Goovee refs are formatted as: name-reference~contextId~tenantId
  const refParts = ref.split('~');
  const [contextId, tenantId] =
    refParts.length >= 3 ? [refParts.at(-2)!, refParts.at(-1)!] : [null, null];

  if (!(contextId && tenantId)) {
    // Ref does not match Goovee format — likely a legacy invoice, forward to legacy ERP.
    console.error(
      '[UP2PAY][WEBHOOK] Ref does not match Goovee format, forwarding to legacy',
      {ref},
    );
    const forwarded = forwardToLegacy(request);
    return new NextResponse(forwarded ? 'OK' : 'Bad Request', {
      status: forwarded ? 200 : 400,
    });
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    console.error('[UP2PAY][WEBHOOK] Tenant not found', {tenantId});
    return new NextResponse('Bad Request', {status: 400});
  }
  const {client, config} = tenant;

  const paymentContext = await findPaymentContext({
    id: contextId,
    client,
    mode: PaymentOption.up2pay,
    ignoreStatus: true,
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
    const forwarded = forwardToLegacy(request);
    return new NextResponse(forwarded ? 'OK' : 'Bad Request', {
      status: forwarded ? 200 : 400,
    });
  }

  if (paymentContext.status !== CONTEXT_STATUS.pending) {
    // Already claimed (processing) or terminal (processed / cancelled /
    // failed / expired) — redelivery cannot help past the claim.
    console.log('[UP2PAY][WEBHOOK] Context already handled, skipping', {
      contextId,
      status: paymentContext.status,
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
      client,
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
      client,
    });

    return new NextResponse('Bad Request', {status: 400});
  }

  // Missing/unknown source or entity id is handled by the saga itself — the
  // money is captured, so such contexts land in the reconcile queue instead of
  // being marked failed.
  const source = paymentContext.data?.source;
  const entityId = paymentContext.data?.id;

  const outcome = await completePayment({
    tenantId,
    client,
    config,
    paymentContext,
    amount: paidAmount,
    /* Only present once PBX_RETOUR includes the transaction number
     * (numtrans:S — pending sandbox verification); null until then. */
    providerTransactionRef: params.get('numtrans') ?? params.get('trans'),
  });

  if (outcome.status === SAGA_OUTCOME_STATUS.notClaimed) {
    console.log('[UP2PAY][WEBHOOK] Context claimed by another runner', {
      contextId,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (outcome.status !== SAGA_OUTCOME_STATUS.completed) {
    // Post-claim failure is terminal (flagged for the ERP queues) —
    // acknowledge with 200, redelivery cannot help anymore.
    console.error('[UP2PAY][WEBHOOK] Payment saga failed', {
      contextId,
      outcome,
    });
    return new NextResponse('OK', {status: 200});
  }

  if (source === PAYMENT_SOURCE.INVOICES && entityId && paymentContext.payer) {
    after(() =>
      notifyInvoicePaymentSuccess({
        invoiceId: entityId,
        payer: paymentContext.payer!,
        tenantId,
        client,
      }),
    );
  }

  return new NextResponse('OK', {status: 200});
}
