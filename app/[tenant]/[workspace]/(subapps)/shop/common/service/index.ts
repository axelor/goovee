import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {Workspace} from '@/orm/workspace';
import {Cloned} from '@/types/util';
import type {Tenant} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {SuccessResponse} from '@/types/action';
import type {CartInput, CartItemInput} from '@/subapps/shop/common/validators';
import {computeTotal} from '@/utils/cart';
import {TENANT_HEADER} from '@/proxy';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {MAIN_PRICE} from '@/constants';
import {calculateAdvanceAmount} from '@/utils/payment';
import {SAGA_FAILURE_STATUS, SagaStepError} from '@/lib/core/saga';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/subapps/shop/common/orm/product';
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {formatNumber} from '@/subapps/shop/common/utils/order';

export async function createOrder({
  cart,
  workspace,
  workspaceConfig,
  user,
  client,
  config,
  paymentModeId,
  paymentContextId,
}: {
  cart: CartInput;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  user: NonNullable<User>;
  client: Client;
  config: Tenant['config'];
  paymentModeId?: string;
  /**
   * AOS dedup key: a call repeated with the same context id (webhook race,
   * admin retry) resumes the existing order chain instead of duplicating it.
   */
  paymentContextId?: string;
}): Promise<SuccessResponse<string>> {
  const {aos} = config;

  const computedProducts = await Promise.all(
    cart.items.map((i: CartItemInput) =>
      findProduct({
        id: i.product,
        workspace,
        workspaceConfig,
        user,
        client,
        config,
      }),
    ),
  );

  const $cart = {
    ...cart,
    items: cart.items.map((i: CartItemInput) => ({
      ...i,
      computedProduct:
        computedProducts.find(
          cp => Number(cp?.product?.id) === Number(i.product),
        ) ?? undefined,
    })),
  };

  const {total} = computeTotal({
    cart: $cart,
    config: workspaceConfig,
    formatNumber,
  });

  const {id, isContact, mainPartnerId} = user;
  const partnerId = isContact && mainPartnerId ? mainPartnerId : id;
  const contactId = isContact && mainPartnerId ? id : undefined;

  const {invoicingAddress, deliveryAddress} = cart;
  const payInAdvance = workspaceConfig?.payInAdvance;
  const advancePaymentPercentage = workspaceConfig?.advancePaymentPercentage;

  const paidAmount =
    payInAdvance && Number(advancePaymentPercentage) > 0
      ? calculateAdvanceAmount({
          amount: Number(total),
          percentage: Number(advancePaymentPercentage),
          payInAdvance,
        }).toString()
      : Number(total).toString();

  const isAtiPricing = workspaceConfig?.mainPrice === MAIN_PRICE.ATI;

  const payload = {
    partnerId,
    contactId,
    shipping: 0,
    total,
    inAti: isAtiPricing,
    items: $cart.items.map(i => {
      const {computedProduct, note, quantity} = i;
      if (!computedProduct) return null;
      const {product, price} = computedProduct;
      return {
        productId: product?.id,
        note: note || '',
        quantity,
        price: isAtiPricing ? price?.ati : price?.wt,
      };
    }),
    workspaceId: workspace.id,
    invocingPartnerAddressId: invoicingAddress,
    deliveryPartnerAddressId: deliveryAddress,
    paidAmount,
    paymentModeId,
    paymentContextId,
  };

  let res;
  try {
    res = await aosClient(aos).request<{
      status?: number;
      message?: string;
      /* Order id string on success; {orderId, failedStage} when the chain
       * broke mid-way. */
      data?: string | {orderId?: string | number; failedStage?: string};
    }>('ws/portal/orders/order', {body: payload});
  } catch (err) {
    console.error('Order creation failed:', err);

    /* This message ends up in the payment context's failureReason (the saga is
     * the only consumer) — surface the actual cause so the ERP admin can act
     * on the record without digging through server logs. aosClient errors
     * already carry the method, URL and HTTP status in their message. */
    const detail = err instanceof Error ? err.message : 'Unknown error';

    throw new Error(`AOS order call failed: ${detail}`);
  }

  if (res?.status === -1) {
    /* No t() here: this message ends up in the payment context's
     * failureReason (the saga is the only consumer) — an admin record, not a
     * user-facing string — and the saga may not run inside a request scope,
     * where t() would crash. */
    const message =
      res?.message || 'AOS rejected the order with no error message.';

    /* AOS reports the committed order id + failed stage when the chain broke
     * mid-way (the endpoint is three transactions). An order that exists
     * means the customer got something — route the saga failure to the
     * reconcile queue with the order id instead of asking for a refund. */
    const failure = typeof res?.data === 'object' ? res.data : undefined;
    const orderId = failure?.orderId;
    const failedStage = failure?.failedStage;
    if (orderId) {
      throw new SagaStepError(
        `${message} (order ${orderId} committed, failed at stage '${failedStage}')`,
        {
          routeTo: SAGA_FAILURE_STATUS.reconcileRequired,
          entityId: String(orderId),
          stage: failedStage ? String(failedStage) : undefined,
        },
      );
    }

    throw new Error(message);
  }

  return {success: true, data: typeof res?.data === 'string' ? res.data : ''};
}

export async function requestOrder({
  cart,
  workspace,
  workspaceConfig,
  type = 'order',
}: {
  cart: CartInput;
  workspace: Workspace | Cloned<Workspace>;
  workspaceConfig: ShopConfig | Cloned<ShopConfig>;
  type?: 'quotation' | 'order';
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return null;
  }

  if (!cart?.items?.length) return null;

  const tenant = await manager.getTenant(tenantId);

  if (!tenant?.config?.aos?.url) return null;

  const {aos} = tenant.config;
  const {client, config} = tenant;

  const session = await getSession();
  const user = session?.user;

  if (!(session && workspace && workspaceConfig)) return null;

  try {
    const computedProducts = (
      await Promise.all(
        cart.items.map(i =>
          findProduct({
            id: i.product,
            workspace,
            workspaceConfig,
            user,
            client,
            config,
          }),
        ),
      )
    ).filter(Boolean);

    const $cart = {
      ...cart,
      items: [
        ...cart.items.map(i => ({
          ...i,
          computedProduct:
            computedProducts.find(
              cp => Number(cp?.product?.id) === Number(i.product),
            ) ?? undefined,
        })),
      ],
    };

    const {total} = computeTotal({
      cart: $cart,
      config: workspaceConfig,
      formatNumber,
    });

    let partnerId, contactId;

    if (user) {
      const {id, isContact, mainPartnerId} = user;
      if (isContact && mainPartnerId) {
        partnerId = mainPartnerId;
        contactId = id;
      } else {
        partnerId = id;
      }
    }
    const {invoicingAddress, deliveryAddress} = cart;
    const isAtiPricing = workspaceConfig?.mainPrice === MAIN_PRICE.ATI;

    const payload = {
      partnerId,
      contactId,
      shipping: 0,
      total,
      inAti: isAtiPricing,
      items: $cart.items.map(i => {
        const {computedProduct, note, quantity} = i;
        if (!computedProduct) return null;
        const {product, price} = computedProduct;
        return {
          productId: product?.id,
          note: note || '',
          quantity,
          price: isAtiPricing ? price?.ati : price?.wt,
        };
      }),
      workspaceId: workspace.id,
      invocingPartnerAddressId: invoicingAddress,
      deliveryPartnerAddressId: deliveryAddress,
    };

    const res = await aosClient(aos).request<
      {status?: number} & Record<string, unknown>
    >(`ws/portal/orders/${type}`, {body: payload});

    if (res?.status === -1) {
      return null;
    }

    return res;
  } catch (err) {
    console.error(err);
    return null;
  }
}
