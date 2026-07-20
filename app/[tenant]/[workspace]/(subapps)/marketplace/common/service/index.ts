import {t} from '@/locale/server';
import type {Tenant} from '@/tenant';
import {getAOSAuthHeaders} from '@/tenant/auth';
import axios from 'axios';

/* Triggers the AOS side to build the SaleOrder + Invoice for a marketplace order and link them onto
 * the order. The order header and its lines are already persisted, so only the order id is sent —
 * the backend reads everything it needs server-side. Throws on failure; the order is then left for
 * admin recovery. */
export async function createMarketplaceOrder({
  orderId,
  config,
}: {
  orderId: string;
  config: Tenant['config'];
}): Promise<void> {
  const aos = config.aos;
  const ws = `${aos.url}/ws/portal/marketplace/order`;

  const res = await axios.post(
    ws,
    {marketplaceOrderId: orderId},
    {headers: getAOSAuthHeaders(aos.auth)},
  );

  if (res?.data?.status === -1) {
    throw new Error(
      res?.data?.message
        ? await t(res.data.message)
        : await t('Order creation failed.'),
    );
  }
}
