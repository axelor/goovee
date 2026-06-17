import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {getAOSHeaders} from '@/tenant/auth';
import {t} from '@/locale/server';
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
  paymentModeId?: number;
}) {
  if (!amount || !invoiceId) {
    return {
      error: true,
      message: await t(
        amount ? 'Invoice id is required.' : 'Invoice amount is missing!',
      ),
    };
  }

  const aos = config?.aos;
  if (!aos?.url) {
    return {error: true, message: await t('Webservice not available.')};
  }

  const payload = {
    invoiceId: invoiceId,
    paidAmount: amount,
    ...(paymentModeId ? {paymentModeId} : {}),
  };

  try {
    const {data} = await axios.post(
      `${aos.url}/ws/portal/invoice/payment`,
      payload,
      {headers: getAOSHeaders(aos)},
    );
    if (data?.status === -1) {
      return {
        error: true,
        message: await t(
          data?.message || 'Unable to update invoice. Please try again later.',
        ),
      };
    }

    return data;
  } catch (err) {
    console.error('Invoice update failed:', err);
    return {
      error: true,
      message: await t(
        'An error occurred while updating your invoice. Please try again later.',
      ),
    };
  }
}
