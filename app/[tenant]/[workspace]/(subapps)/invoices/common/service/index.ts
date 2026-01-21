import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {manager, Tenant} from '@/tenant';
import {ID} from '@goovee/orm';

export async function updateInvoice({
  tenantId,
  amount,
  invoiceId,
}: {
  tenantId: Tenant['id'];
  amount: string | number;
  invoiceId: ID;
}) {
  if (!amount || !invoiceId) {
    return {
      error: true,
      message: await t(
        amount ? 'Invoice id is required.' : 'Invoice amount is missing!',
      ),
    };
  }

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return {
      error: true,
      message: await t('Invalid Tenant'),
    };
  }

  const aos = tenant?.config?.aos;
  if (!aos?.url) {
    return {error: true, message: await t('Webservice not available.')};
  }

  const payload = {
    invoiceId: invoiceId,
    paidAmount: amount,
  };

  try {
    const {data} = await axios.post(
      `${aos.url}/ws/portal/invoice/payment`,
      payload,
      {
        auth: {
          username: aos.auth.username,
          password: aos.auth.password,
        },
      },
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
