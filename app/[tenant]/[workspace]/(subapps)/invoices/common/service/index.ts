// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import type {TenantConfig} from '@/tenant';
import type {ID} from '@/types';

export async function updateInvoice({
  config,
  amount,
  invoiceId,
  paymentModeId,
}: {
  config: TenantConfig;
  amount: string | number;
  invoiceId: ID;
  paymentModeId?: string;
}) {
  /* No t() anywhere in this function: its error messages end up in the
   * payment context's failureReason (the saga is the only consumer) — an
   * admin record, not a user-facing string — and the saga may not run inside
   * a request scope, where t() would crash. */
  if (!amount || !invoiceId) {
    return {
      error: true,
      message: amount
        ? 'Invoice id is required.'
        : 'Invoice amount is missing!',
    };
  }

  const aos = config?.aos;
  if (!aos?.url) {
    return {error: true, message: 'Webservice not available.'};
  }

  const payload = {
    invoiceId: invoiceId,
    paidAmount: amount,
    ...(paymentModeId ? {paymentModeId} : {}),
  };

  try {
    const data = await aosClient(aos).request<
      {status?: number; message?: string} & Record<string, unknown>
    >('ws/portal/invoice/payment', {body: payload});
    if (data?.status === -1) {
      return {
        error: true,
        message:
          data?.message || 'AOS rejected the payment with no error message.',
      };
    }

    return data;
  } catch (err) {
    console.error('Invoice update failed:', err);

    /* Surface the actual cause so the ERP admin can act on the record
     * without digging through server logs. aosClient errors already carry
     * the method, URL and HTTP status in their message. */
    const detail = err instanceof Error ? err.message : 'Unknown error';

    return {error: true, message: `AOS invoice payment call failed: ${detail}`};
  }
}
