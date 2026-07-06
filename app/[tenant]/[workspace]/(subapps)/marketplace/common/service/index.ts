import {t} from '@/locale/server';
import type {Tenant} from '@/tenant';
import {getAOSAuthHeaders} from '@/tenant/auth';
import axios from 'axios';
import type {Workspace} from '@/orm/workspace';
import type {ValidatedCart} from '../utils/cart';

type CreateOrderArgs = {
  cart: ValidatedCart;
  workspace: Workspace;
  mainPartnerId: string;
  contactId?: string;
  invoicingAddressId: string;
  paidAmount: number;
  paymentModeId?: string;
  config: Tenant['config'];
};

type CreateOrderResult = {
  saleOrderId: string;
  invoiceId: string;
  invoicePaymentId: string;
};

export async function createMarketplaceOrder({
  cart,
  workspace,
  mainPartnerId,
  contactId,
  invoicingAddressId,
  paidAmount,
  paymentModeId,
  config,
}: CreateOrderArgs): Promise<CreateOrderResult> {
  const aos = config.aos;
  const ws = `${aos.url}/ws/portal/marketplace/order`;

  const payload = {
    partnerId: mainPartnerId,
    contactId,
    workspaceId: workspace.id,
    portalAppConfigId: workspace.config.id,
    currencyCodeISO: cart.currencyCodeISO,
    invoicingPartnerAddressId: invoicingAddressId,
    items: cart.items.map(item => ({
      marketplaceProductId: item.productId,
      priceAti: item.priceAti,
    })),
    paidAmount: String(paidAmount),
    paymentModeId,
  };

  const res = await axios.post(ws, payload, {
    headers: getAOSAuthHeaders(aos.auth),
  });

  if (res?.data?.status === -1) {
    throw new Error(
      res?.data?.message
        ? await t(res.data.message)
        : await t('Order creation failed.'),
    );
  }

  const data = res?.data?.data;
  if (!data?.saleOrderId || !data?.invoiceId || !data?.invoicePaymentId) {
    throw new Error(await t('Order creation returned an incomplete response.'));
  }

  return {
    saleOrderId: String(data.saleOrderId),
    invoiceId: String(data.invoiceId),
    invoicePaymentId: String(data.invoicePaymentId),
  };
}
