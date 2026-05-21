import axios from 'axios';

import {getAOSAuthHeaders} from '@/tenant/auth';
import {t} from '@/locale/server';
import type {Tenant} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

import type {ValidatedCart} from '../actions/cart-validation';

type CreateOrderArgs = {
  cart: ValidatedCart;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  mainPartnerId: string;
  contactId?: string;
  invoicingAddressId: string | null;
  deliveryAddressId: string | null;
  paidAmount: number;
  paymentModeId?: string;
  config: Tenant['config'];
};

/* Posts the marketplace cart to the AOS portal SO endpoint. Mirrors the
 * shop's createOrder shape so the same Java path
 * (SaleOrderPortalServiceImpl) handles SO + Invoice + InvoicePayment in
 * one tx. Returns the SaleOrder id; the caller is expected to look up
 * the Invoice via `AOSInvoice.saleOrder` afterwards. */
export async function createMarketplaceOrder({
  cart,
  workspace,
  mainPartnerId,
  contactId,
  invoicingAddressId,
  deliveryAddressId,
  paidAmount,
  paymentModeId,
  config,
}: CreateOrderArgs): Promise<{saleOrderId: string}> {
  const aos = config.aos;
  const ws = `${aos.url}/ws/portal/orders/order`;

  const payload = {
    partnerId: mainPartnerId,
    contactId,
    shipping: 0,
    total: cart.total,
    inAti: true, // paid price is always ATI, so we always send true
    items: cart.items.map(item => ({
      productId: item.productId,
      quantity: 1,
      price: item.priceAti,
    })),
    workspaceId: workspace.id,
    invocingPartnerAddressId: invoicingAddressId,
    deliveryPartnerAddressId: deliveryAddressId,
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

  return {saleOrderId: String(res?.data?.data)};
}

export async function findInvoiceBySaleOrderId({
  client,
  saleOrderId,
}: {
  client: Client;
  saleOrderId: string;
}) {
  return client.aOSInvoice.findOne({
    where: {saleOrder: {id: saleOrderId}},
    select: {id: true, invoiceId: true, statusSelect: true},
  });
}
