import 'server-only';

import {z} from 'zod';
import {BigDecimal} from '@goovee/orm';

import {ensureAccess} from '@/access/ensure-access';
import {accessMessage} from '@/access/denial';
import {MAIN_PRICE, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {getTranslation, t} from '@/locale/server';
import {tenantURLs} from '@/url/scope';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {resolveCurrency, toMinorUnits} from '@/payment/domain/money';
import {GATEWAY, PAYMENT_SOURCE} from '@/payment/domain/types';
import type {PaymentSourceHandler} from '@/payment/sources/types';
import {payerLocale, sendPaymentConfirmation} from '@/payment/confirmation';
import {computeTotal} from '@/utils/cart';

import {getShopConfig} from '../orm/config';
import {priceCart} from '../service';
import {computeExpectedAmount, formatNumber} from '../utils/order';
import {CartSchema} from '../validators';
import {SUBJECT_MODEL, subjectIdOf} from '@/payment/domain/subject';

const ShopIntentSchema = z.object({
  cart: CartSchema,
});

type ShopIntent = z.infer<typeof ShopIntentSchema>;

/* The cart as the server priced it at the button press, in the workspace's
 * tax mode. Delivery writes exactly these figures: pricing inputs may have
 * moved since, and an order carrying a total the buyer never paid is worse
 * than honouring the price they saw. */
const ShopSnapshotSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      note: z.string().nullable(),
      unitPrice: z.string(),
    }),
  ),
  total: z.string(),
  paidAmount: z.string(),
  inAti: z.boolean(),
  currencyCode: z.string(),
  partnerId: z.string(),
  contactId: z.string().nullable(),
  invoicingAddressId: z.string(),
  deliveryAddressId: z.string(),
  companyId: z.string().nullable(),
});

type ShopSnapshot = z.infer<typeof ShopSnapshotSchema>;

/**
 * The address the buyer chose, once it is established as one of their own in
 * the role it was chosen for. The browser holds the chosen ids in its cart, so
 * an id it hands back proves nothing until the partner owns it here: the ERP
 * only makes the same check when it builds the sale order, by which time the
 * money is captured and the registration would park for a human.
 */
async function findOwnAddress({
  addressId,
  partnerId,
  role,
  client,
}: {
  addressId: string;
  partnerId: string;
  role: 'invoicing' | 'delivery';
  client: Client;
}) {
  return client.aOSPartnerAddress.findOne({
    where: {
      id: addressId,
      partner: {id: partnerId},
      ...(role === 'invoicing'
        ? {isInvoicingAddr: true}
        : {isDeliveryAddr: true}),
    },
    select: {id: true},
  });
}

/**
 * Buying from the shop. Nothing exists in the ERP before the capture: delivery
 * records the order request and its lines at the prices charged, and the ERP
 * builds the sale order and the invoice from those rows when it registers the payment.
 */
export const shopPaymentSource: PaymentSourceHandler<
  ShopIntent,
  typeof PAYMENT_SOURCE.shop
> = {
  source: PAYMENT_SOURCE.shop,

  intentSchema: ShopIntentSchema,

  /* Only gateways that settle while the buyer waits. The order is recorded only
   * once the money is captured, so a transfer that settled days later would
   * hold the cart's goods in limbo with nothing for the buyer to come back to. */
  gateways: [GATEWAY.stripeCard, GATEWAY.paypal, GATEWAY.paybox],

  async prepare({intent}) {
    const access = await ensureAccess({
      code: SUBAPP_CODES.shop,
      allowGuest: false,
    });
    if (!access.ok) {
      return {error: true, message: await accessMessage(access.reason)};
    }
    const {user, tenant, workspace} = access;
    const {client} = tenant;

    const config = await getShopConfig(workspace.config.id, client);
    if (!config) {
      return {error: true, message: await t('Invalid workspace')};
    }
    if (!config.confirmOrder) {
      return {error: true, message: await t('Not allowed')};
    }
    if (!config.allowOnlinePaymentForEcommerce) {
      return {error: true, message: await t('Online payment is not available')};
    }
    if (!config.paymentOptionSet?.length) {
      return {
        error: true,
        message: await t('Payment options are not configured'),
      };
    }
    if (await shouldHidePricesAndPurchase({user, config, client})) {
      return {error: true, message: await t('Unauthorized')};
    }

    const pricedCart = await priceCart({
      cart: intent.cart,
      workspace,
      workspaceConfig: config,
      user,
      client,
      config: tenant.config,
    });
    if (pricedCart === 'unconfirmed') {
      return {
        error: true,
        message: await t(
          'Something went wrong with your cart. Please clear it and try again.',
        ),
      };
    }
    if (pricedCart === 'unavailable') {
      return {
        error: true,
        message: await t('Some items in your cart are no longer available.'),
      };
    }

    const {total, currency: cartCurrency} = computeTotal({
      cart: pricedCart,
      config,
      formatNumber,
    });

    const payer = user.email;

    const currency = await resolveCurrency(client, cartCurrency.code);
    /* Both figures are rounded to the ERP currency's scale, and only here. The
     * cart totals at the catalogue's own scale, which comes from the company
     * currency and need not be this one; and an advance is a percentage, so it
     * lands on fractions no currency can express — half of 19.99 is 9.995.
     * Rounding once, from the same total, is what makes the charge, the ledger
     * amount and the amount the ERP applies to the invoice one number, and
     * what keeps a full payment exactly equal to the total. */
    const chargedTotal = Number(total).toFixed(currency.scale);
    const paidAmount = Number(
      computeExpectedAmount({total: chargedTotal, config}),
    ).toFixed(currency.scale);
    const inAti = config.mainPrice === MAIN_PRICE.ATI;
    const partnerId =
      user.isContact && user.mainPartnerId ? user.mainPartnerId : user.id;

    const {invoicingAddress, deliveryAddress} = intent.cart;
    if (!invoicingAddress || !deliveryAddress) {
      return {error: true, message: await t('Select address to continue')};
    }
    const [invoicingOwned, deliveryOwned] = await Promise.all([
      findOwnAddress({
        addressId: String(invoicingAddress),
        partnerId,
        role: 'invoicing',
        client,
      }),
      findOwnAddress({
        addressId: String(deliveryAddress),
        partnerId,
        role: 'delivery',
        client,
      }),
    ]);
    if (!invoicingOwned || !deliveryOwned) {
      return {error: true, message: await t('Select address to continue')};
    }

    const snapshot: ShopSnapshot = {
      items: pricedCart.items.map(item => ({
        productId: String(item.computedProduct.product.id),
        quantity: Number(item.quantity),
        note: item.note || null,
        unitPrice: String(
          (inAti
            ? item.computedProduct.price.ati
            : item.computedProduct.price.wt) ?? 0,
        ),
      })),
      total: chargedTotal,
      paidAmount,
      inAti,
      currencyCode: currency.code,
      partnerId,
      contactId: user.isContact && user.mainPartnerId ? user.id : null,
      invoicingAddressId: invoicingOwned.id,
      deliveryAddressId: deliveryOwned.id,
      companyId: config.company?.id ?? null,
    };

    return {
      success: true,
      data: {
        money: {
          amount: toMinorUnits(paidAmount, currency.scale),
          currencyCode: currency.code,
          currencyScale: currency.scale,
        },
        payer,
        /* An advance is named as one, so its completed payment never reads as
         * the order paid; the rest is owed on the order's invoice. */
        subjectLabel:
          paidAmount === chargedTotal
            ? await t('Cart: {0} item(s)', String(pricedCart.items.length))
            : await t(
                'Advance on cart: {0} item(s)',
                String(pricedCart.items.length),
              ),
        paymentOptions: config.paymentOptionSet,
        workspace: {
          id: workspace.id,
          url: workspace.url,
          configId: workspace.config.id,
        },
        subject: null,
        snapshot,
      },
    };
  },

  async deliver({payment, snapshot, txClient}) {
    const parsed = ShopSnapshotSchema.safeParse(snapshot);
    if (!parsed.success) {
      return {
        delivered: false,
        reason: `The order snapshot does not have the expected shape: ${z.prettifyError(parsed.error)}`,
      };
    }
    const {
      items,
      total,
      paidAmount,
      inAti,
      currencyCode,
      partnerId,
      contactId,
      invoicingAddressId,
      deliveryAddressId,
      companyId,
    } = parsed.data;
    if (!items.length) {
      return {
        delivered: false,
        reason: 'The order snapshot names no items',
      };
    }

    const request = await txClient.aOSPortalOrderRequest.create({
      data: {
        clientPartner: {select: {id: partnerId}},
        ...(contactId && {contactPartner: {select: {id: contactId}}}),
        ...(companyId && {company: {select: {id: companyId}}}),
        portalWorkspace: {select: {id: payment.workspaceId}},
        ...(payment.paymentModeId && {
          paymentMode: {select: {id: payment.paymentModeId}},
        }),
        deliveryPartnerAddress: {select: {id: deliveryAddressId}},
        invoicingPartnerAddress: {select: {id: invoicingAddressId}},
        inAti,
        currency: {select: {codeISO: currencyCode}},
        total: new BigDecimal(total),
        paidAmount: new BigDecimal(paidAmount),
      },
      select: {id: true},
    });

    for (const [index, item] of items.entries()) {
      await txClient.aOSPortalOrderRequestLine.create({
        data: {
          orderRequest: {select: {id: request.id}},
          product: {select: {id: item.productId}},
          sequence: index,
          quantity: new BigDecimal(String(item.quantity)),
          unitPrice: new BigDecimal(item.unitPrice),
          ...(item.note && {note: item.note}),
        },
        select: {id: true},
      });
    }

    return {
      delivered: true,
      subject: {model: SUBJECT_MODEL.orderRequest, id: request.id},
    };
  },

  async notify({payment, subject, snapshot, tenant}) {
    const translate = getTranslation.bind(null, {
      locale: await payerLocale(tenant, payment.payer),
      tenant: tenant.id,
    });
    const link = shopPaymentSource.onwardLink({subject, snapshot});
    await sendPaymentConfirmation({
      tenant,
      payment,
      title: await translate('Order confirmed'),
      link:
        link &&
        tenantURLs(tenant.id)
          .workspaceByKey(payment.workspaceUrl)
          .forExternal(link),
      translate,
    });
  },

  /* The order request exists only once the capture was delivered, so anything
   * else — nothing charged, or captured but undeliverable — goes back to the
   * cart, which still holds the goods. Deliberately not the checkout: money
   * may already have been taken for this cart, and the pay buttons there are
   * one click from taking it twice. A delivered payment goes on to its
   * confirmation, which reads the sale order off the request, so the link is
   * right whether the ERP has registered the payment yet or not. */
  onwardLink({subject}) {
    const requestId = subjectIdOf(subject, SUBJECT_MODEL.orderRequest);
    if (!requestId) {
      return `/${SUBAPP_CODES.shop}/cart`;
    }
    return `/${SUBAPP_CODES.shop}/cart/checkout/confirmation?request=${encodeURIComponent(requestId)}`;
  },
};
