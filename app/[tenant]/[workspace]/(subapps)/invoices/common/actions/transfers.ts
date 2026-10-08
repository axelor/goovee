'use server';

import {z} from 'zod';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {PaymentOption} from '@/types';
import type {ActionResponse} from '@/types/action';
import {isPaymentOptionAvailable} from '@/utils/payment';
import {IdSchema} from '@/utils/validators';
import {withdrawTransferForPayer} from '@/payment/transfers';

// ---- LOCAL IMPORTS ---- //
import {INVOICE_PAYMENT_OPTIONS} from '@/subapps/invoices/common/constants/invoices';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {resolveInvoicePaymentAccess} from '@/subapps/invoices/common/utils/validations';

const CancelPendingTransferSchema = z.object({
  invoiceId: IdSchema,
  transferId: IdSchema,
  workspaceURL: z.string().min(1),
  token: z.string().min(1).optional(),
});

/**
 * The payer withdraws a bank transfer they started on an invoice and will not
 * make. The invoice is opened the way the invoice page opens it — the
 * signed-in payer's own, or the one the link's token names — and the transfer
 * is looked up among that invoice's open ones, so a token for one invoice
 * cannot reach another's transfer. A transfer that has received money is not
 * withdrawn; the bank's own event settles it.
 */
export async function cancelPendingTransfer(
  input: z.input<typeof CancelPendingTransferSchema>,
): ActionResponse<null> {
  const parsed = CancelPendingTransferSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {invoiceId, transferId, workspaceURL, token} = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  try {
    const access = await resolveInvoicePaymentAccess({
      workspaceURL,
      tenantId,
      token,
    });
    if (access.error) {
      return access;
    }
    const {tenant, config, invoiceFilter} = access.data;

    if (!config.allowOnlinePaymentForInvoices) {
      return {error: true, message: await t('Online payment is not available')};
    }
    if (config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {error: true, message: await t('Invoice payment not allowed')};
    }
    if (!config.paymentOptionSet?.length) {
      return {error: true, message: await t('Payment options not selected!')};
    }
    if (
      !isPaymentOptionAvailable(config.paymentOptionSet, PaymentOption.stripe)
    ) {
      return {error: true, message: await t('Stripe is not available')};
    }

    const invoice = await findInvoice({
      id: invoiceId,
      ...invoiceFilter,
      client: tenant.client,
      workspaceURL: access.data.workspaceURL,
    });
    if (!invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    const outcome = await withdrawTransferForPayer({
      tenant,
      invoiceId: invoice.id,
      sessionId: transferId,
    });
    switch (outcome) {
      case 'cancelled':
      case 'already-ended':
        return {success: true, data: null};
      case 'funded':
        return {
          error: true,
          message: await t(
            'This bank transfer has already received money and can no longer be canceled.',
          ),
        };
      case 'not-found':
        return {
          error: true,
          message: await t('This bank transfer is no longer pending.'),
        };
      /* Not reached: the payer's request sets no limit to keep a transfer
       * under. Nothing was withdrawn, so it is not reported as success. */
      case 'kept':
        return {
          error: true,
          message: await t(
            'Something went wrong while canceling the bank transfer',
          ),
        };
    }
  } catch (error) {
    console.error('Bank transfer could not be canceled:', error);
    return {
      error: true,
      message: await t(
        'Something went wrong while canceling the bank transfer',
      ),
    };
  }
}
