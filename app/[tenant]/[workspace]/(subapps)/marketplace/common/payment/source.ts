import 'server-only';

import {z} from 'zod';

import {ensureAccess} from '@/access/ensure-access';
import {accessMessage} from '@/access/denial';
import {SUBAPP_CODES} from '@/constants';
import {getTranslation, t} from '@/locale/server';
import {tenantURLs} from '@/url/scope';
import {resolveCurrency, toMinorUnits} from '@/payment/domain/money';
import {GATEWAY, PAYMENT_SOURCE} from '@/payment/domain/types';
import type {PaymentSourceHandler} from '@/payment/sources/types';
import {payerLocale, sendPaymentConfirmation} from '@/payment/confirmation';
import {getPartnerId} from '@/utils';

import {findPartnerInvoicingAddresses, recordOrder} from '../orm';
import {getMarketplaceConfig} from '../orm/config';
import {
  CartProductIdsSchema,
  recheckCartAvailability,
  validateCart,
} from '../utils/cart';
import {SUBJECT_MODEL, subjectIdOf} from '@/payment/domain/subject';

const MarketplaceIntentSchema = z.object({
  productIds: CartProductIdsSchema,
});

type MarketplaceIntent = z.infer<typeof MarketplaceIntentSchema>;

/* The cart as the server priced it at the button press. Delivery honours these
 * prices: pricing inputs may have moved since, and refusing money already
 * captured over server-side drift is worse than honouring what the buyer saw. */
const MarketplaceSnapshotSchema = z.object({
  cart: z.object({
    items: z.array(
      z.object({
        productId: z.string(),
        productSlug: z.string(),
        name: z.string(),
        priceWt: z.number(),
        priceAti: z.number(),
        taxRate: z.number(),
        scale: z.number(),
        currencyCodeISO: z.string(),
        currencySymbol: z.string().nullable(),
      }),
    ),
    total: z.number(),
    currencyCodeISO: z.string(),
  }),
  mainPartnerId: z.string(),
  ordererId: z.string(),
  companyId: z.string().nullable(),
});

type MarketplaceSnapshot = z.infer<typeof MarketplaceSnapshotSchema>;

/**
 * Buying marketplace products. Nothing exists in the ERP before the capture:
 * delivery records the order and its lines, which is what grants the buyer
 * access, and the ERP builds the sale order and invoice from those rows when
 * it registers the payment.
 */
export const marketplacePaymentSource: PaymentSourceHandler<
  MarketplaceIntent,
  typeof PAYMENT_SOURCE.marketplace
> = {
  source: PAYMENT_SOURCE.marketplace,

  intentSchema: MarketplaceIntentSchema,

  requiresPaymentMode: true,

  /* Only gateways that settle while the buyer waits. A transfer that settles
   * days later would leave nothing to show for it in the meantime, and no
   * way back to the result but the purchase history. */
  gateways: [GATEWAY.stripeCard, GATEWAY.paypal, GATEWAY.paybox],

  async prepare({intent}) {
    const access = await ensureAccess({code: SUBAPP_CODES.marketplace});
    if (!access.ok) {
      return {error: true, message: await accessMessage(access.reason)};
    }
    const {client} = access.tenant;

    const config = await getMarketplaceConfig(
      access.workspace.config.id,
      client,
    );
    if (!config) {
      return {error: true, message: await t('Invalid workspace')};
    }
    if (!config.allowOnlinePaymentForEcommerce) {
      return {
        error: true,
        message: await t('Online payment is not available.'),
      };
    }
    if (!config.paymentOptionSet?.length) {
      return {
        error: true,
        message: await t('Payment options are not configured.'),
      };
    }

    const mainPartnerId = getPartnerId(access.user);
    const cartResult = await validateCart({
      client,
      workspace: access.workspace,
      config,
      mainPartnerId,
      productIds: intent.productIds,
    });
    if (cartResult.error) {
      return cartResult;
    }
    const cart = cartResult.data;

    const payer = access.user.email;

    const currency = await resolveCurrency(client, cart.currencyCodeISO);
    const snapshot: MarketplaceSnapshot = {
      cart,
      mainPartnerId,
      ordererId: access.user.id,
      companyId: config.company?.id ?? null,
    };

    return {
      success: true,
      data: {
        money: {
          amount: toMinorUnits(cart.total, currency.scale),
          currencyCode: currency.code,
          currencyScale: currency.scale,
        },
        payer,
        subjectLabel: await t('Cart: {0} item(s)', String(cart.items.length)),
        paymentOptions: config.paymentOptionSet,
        workspace: {
          id: access.workspace.id,
          url: access.workspace.url,
          configId: access.workspace.config.id,
        },
        subject: null,
        snapshot,
      },
    };
  },

  async deliver({payment, snapshot, txClient}) {
    const parsed = MarketplaceSnapshotSchema.safeParse(snapshot);
    if (!parsed.success) {
      return {
        delivered: false,
        reason: `The purchase snapshot does not have the expected shape: ${z.prettifyError(parsed.error)}`,
      };
    }
    const {cart, mainPartnerId, ordererId, companyId} = parsed.data;
    if (!cart.items.length) {
      return {
        delivered: false,
        reason: 'The purchase snapshot names no cart items',
      };
    }

    /* Between the button press and the capture the buyer may have bought the
     * same product in another tab, or the publisher may have withdrawn it.
     * Money captured for a cart that can no longer be granted is a human's
     * to decide. */
    const recheck = await recheckCartAvailability({
      client: txClient,
      workspace: {id: payment.workspaceId},
      mainPartnerId,
      productIds: cart.items.map(item => item.productId),
    });
    if (recheck.error) {
      return {delivered: false, reason: recheck.message};
    }

    const buyer = await findPartnerInvoicingAddresses({
      client: txClient,
      mainPartnerId,
    });
    const invoicingAddress =
      buyer?.partnerAddressList?.find(entry => entry.isDefaultAddr) ??
      buyer?.partnerAddressList?.[0];

    const orderId = await recordOrder({
      client: txClient,
      ordererId,
      ownerId: mainPartnerId,
      items: cart.items.map(item => ({
        productId: item.productId,
        priceWt: item.priceWt,
        priceAti: item.priceAti,
        taxRate: item.taxRate,
      })),
      currencyCodeISO: cart.currencyCodeISO,
      paidAmount: cart.total,
      companyId,
      paymentModeId: payment.paymentModeId,
      invoicingAddress: invoicingAddress?.address ?? null,
    });

    return {
      delivered: true,
      subject: {model: SUBJECT_MODEL.marketplaceOrder, id: orderId},
    };
  },

  async notify({payment, subject, snapshot, tenant}) {
    const translate = getTranslation.bind(null, {
      locale: await payerLocale(tenant, payment.payer),
      tenant: tenant.id,
    });
    const link = marketplacePaymentSource.onwardLink({subject, snapshot});
    await sendPaymentConfirmation({
      tenant,
      payment,
      title: await translate('Purchase complete'),
      link:
        link &&
        tenantURLs(tenant.id)
          .workspaceByKey(payment.workspaceUrl)
          .forExternal(link),
      translate,
    });
  },

  onwardLink({subject}) {
    const orderId = subjectIdOf(subject, SUBJECT_MODEL.marketplaceOrder);
    if (!orderId) {
      return `/${SUBAPP_CODES.marketplace}/cart`;
    }
    return `/${SUBAPP_CODES.marketplace}/cart/checkout/success?orderId=${encodeURIComponent(orderId)}`;
  },
};
