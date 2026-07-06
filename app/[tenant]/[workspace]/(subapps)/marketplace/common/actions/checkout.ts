'use server';

import {DEFAULT_CURRENCY_SCALE, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {markPaymentAsProcessed} from '@/payment/common/orm';
import {createPayboxOrder} from '@/payment/paybox/actions';
import {createPaypalOrder} from '@/payment/paypal/actions';
import {createStripeOrder} from '@/payment/stripe/actions';
import {TENANT_HEADER} from '@/proxy';
import {PaymentOption} from '@/types';
import type {ActionResponse} from '@/types/action';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import {WorkspaceURLSchema} from '@/utils/validators';
import {headers} from 'next/headers';
import {z} from 'zod';
import {
  attachOrderToPurchases,
  findPartnerInvoicingAddresses,
  recordPurchases,
} from '../orm';
import {createMarketplaceOrder} from '../service';
import {getMarketplaceConfig} from '../orm/config';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {getPartnerId} from '@/utils';
import {
  CartProductIdsSchema,
  recheckCartAvailability,
  validateCart,
  type ValidatedCart,
} from '../utils/cart';
import {getPaymentInfo} from '../utils/payment-info';

const BaseSchema = z.object({
  productIds: CartProductIdsSchema,
  workspaceURL: WorkspaceURLSchema,
});

const PayboxSchema = BaseSchema.extend({uri: z.string().min(1)});

const CheckoutSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  payment: z.object({
    mode: z.enum(PaymentOption),
    data: z.object({
      id: z.string().optional(),
      params: z.unknown().optional(),
    }),
  }),
});

type Err = {error: true; message: string};
const err = (message: string): Err => ({error: true, message});

/* Per-provider session creators. Each one validates the cart server-side,
 * stashes the validated cart in PaymentContext (via the shared
 * `createXOrder` helpers), and returns the provider's session shape.
 * The unified `checkout()` action pulls the cart back
 * from PaymentContext on the return leg. */

async function prepare(input: {productIds: string[]; workspaceURL: string}) {
  const {productIds, workspaceURL} = input;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return err(await t('Tenant ID is missing.'));
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) return err(await accessMessage(access.reason));
  const {client, config} = access.tenant;
  const marketplaceConfig = await getMarketplaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!marketplaceConfig) return err(await t('Invalid workspace'));
  const partnerId = getPartnerId(access.user);

  const cartResult = await validateCart({
    client,
    workspace: access.workspace,
    config: marketplaceConfig,
    mainPartnerId: partnerId,
    productIds,
  });
  if (cartResult.error) return cartResult;
  const cart = cartResult.data;

  const workspace = access.workspace;
  if (!marketplaceConfig.allowOnlinePaymentForEcommerce) {
    return err(await t('Online payment is not available.'));
  }
  const paymentOptionSet = marketplaceConfig.paymentOptionSet;
  if (!paymentOptionSet?.length) {
    return err(await t('Payment options are not configured.'));
  }

  /* PaymentContext holds the validated cart verbatim. On the return leg
   * `checkout()` trusts these server-stamped prices and only re-checks
   * the time-sensitive invariants (ownership, published version, access). */
  const context = {
    cart,
    workspaceURL,
    mainPartnerId: partnerId,
  };

  return {
    success: true as const,
    data: {access, config, cart, workspace, paymentOptionSet, context},
  };
}

export async function createStripeCheckoutSession(props: {
  productIds: string[];
  workspaceURL: string;
}) {
  const parsed = BaseSchema.safeParse(props);
  if (!parsed.success) return err(z.prettifyError(parsed.error));

  const prep = await prepare(parsed.data);
  if ('error' in prep) return prep;
  const {access, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.stripe)) {
    return err(await t('Stripe is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.stripe)) {
    return err(await t('Payment mode is not configured for {0}.', 'Stripe'));
  }

  const payer = await findGooveeUserByEmail(
    access.user.email,
    access.tenant.client,
  );
  const emailAddress = payer?.emailAddress?.address;
  const payerId = payer?.id;
  if (!emailAddress || !payerId) {
    return err(await t('Buyer email could not be resolved.'));
  }

  try {
    /* Return to the same checkout page; the Stripe button there detects
     * `stripe_session_id` and runs `onStripeValidateSession` (which calls
     * the unified `checkout()` finalize). On success, `onApprove` lands
     * the buyer on /cart/checkout/success. */
    const successUrl = `${parsed.data.workspaceURL}/${SUBAPP_CODES.marketplace}/cart/checkout?stripe_session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${parsed.data.workspaceURL}/${SUBAPP_CODES.marketplace}/cart/checkout/cancel`;

    const session = await createStripeOrder({
      customer: {id: payerId, email: emailAddress},
      name: await t('Marketplace purchase'),
      amount: cart.total,
      currency: cart.currencyCodeISO,
      context,
      tenantId: access.tenant.id,
      client: access.tenant.client,
      url: {success: successUrl, error: cancelUrl},
    });
    return {client_secret: session.client_secret, url: session.url};
  } catch {
    return err(await t('Could not start the Stripe session.'));
  }
}

export async function paypalCreateOrder(props: {
  productIds: string[];
  workspaceURL: string;
}) {
  const parsed = BaseSchema.safeParse(props);
  if (!parsed.success) return err(z.prettifyError(parsed.error));

  const prep = await prepare(parsed.data);
  if ('error' in prep) return prep;
  const {access, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.paypal)) {
    return err(await t('PayPal is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.paypal)) {
    return err(await t('Payment mode is not configured for {0}.', 'PayPal'));
  }

  const payer = await findGooveeUserByEmail(
    access.user.email,
    access.tenant.client,
  );
  const emailAddress = payer?.emailAddress?.address;
  if (!emailAddress) return err(await t('Buyer email could not be resolved.'));

  try {
    const response = await createPaypalOrder({
      amount: cart.total,
      currency: cart.currencyCodeISO,
      email: emailAddress,
      client: access.tenant.client,
      context,
    });
    return {success: true, order: response?.result};
  } catch (e) {
    return err(await t((e as any)?.message ?? 'PayPal order failed.'));
  }
}

export async function payboxCreateOrder(props: {
  productIds: string[];
  workspaceURL: string;
  uri: string;
}) {
  const parsed = PayboxSchema.safeParse(props);
  if (!parsed.success) return err(z.prettifyError(parsed.error));

  const prep = await prepare({
    productIds: parsed.data.productIds,
    workspaceURL: parsed.data.workspaceURL,
  });
  if ('error' in prep) return prep;
  const {access, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.paybox)) {
    return err(await t('Paybox is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.paybox)) {
    return err(await t('Payment mode is not configured for {0}.', 'Paybox'));
  }

  const payer = await findGooveeUserByEmail(
    access.user.email,
    access.tenant.client,
  );
  const emailAddress = payer?.emailAddress?.address;
  if (!emailAddress) return err(await t('Buyer email could not be resolved.'));

  try {
    const response = await createPayboxOrder({
      amount: cart.total,
      currency: cart.currencyCodeISO,
      email: emailAddress,
      context,
      client: access.tenant.client,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}${parsed.data.uri}?paybox_response=true`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}${parsed.data.uri}?paybox_error=true`,
      },
    });
    return {success: true, order: response};
  } catch (e) {
    return err(await t((e as any)?.message ?? 'Paybox order failed.'));
  }
}

export async function checkout(
  props: z.input<typeof CheckoutSchema>,
): ActionResponse<{purchaseIds: string[]}> {
  const parsed = CheckoutSchema.safeParse(props);
  if (!parsed.success)
    return {error: true, message: z.prettifyError(parsed.error)};

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId)
    return {error: true, message: await t('Tenant ID is missing.')};

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: parsed.data.workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {client, config} = access.tenant;
  const marketplaceConfig = await getMarketplaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!marketplaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  let paidAmount: number;
  let paymentContextId: string;
  let paymentContextVersion: number;
  let cart: ValidatedCart;
  let mainPartnerId: string;
  try {
    const info = await getPaymentInfo({
      mode: parsed.data.payment.mode,
      data: parsed.data.payment.data,
      client,
    });
    paidAmount = info.amount;
    paymentContextId = info.context.id;
    paymentContextVersion = info.context.version;
    const stashedCart = info.context.data?.cart as ValidatedCart | undefined;
    if (!stashedCart?.items?.length) {
      return {error: true, message: await t('Payment context is empty.')};
    }
    cart = stashedCart;
    const contextMainPartnerId = info.context.data?.mainPartnerId as
      | string
      | undefined;
    if (!contextMainPartnerId) {
      return {
        error: true,
        message: await t('Invalid context: buyer ID is missing.'),
      };
    }
    mainPartnerId = contextMainPartnerId;
  } catch (e) {
    return {
      error: true,
      message: await t((e as Error).message ?? 'Payment context not found.'),
    };
  }

  /* Anti-tamper: the amount the provider captured must match the cart
   * the provider was handed at prepare time (stashed in PaymentContext).
   * We don't recompute prices here — pricing inputs (taxes, FX rates)
   * could have moved since prepare, and rejecting an already-captured
   * payment over server-state drift is worse than honouring the price
   * the buyer actually saw.
   *
   * Tolerance is half of the cart currency's smallest representable
   * unit: any genuine mismatch is ≥ 1 minor unit, anything below is
   * IEEE 754 / provider-side conversion drift. */
  const tolerance =
    0.5 * 10 ** -(cart.items[0]?.scale ?? DEFAULT_CURRENCY_SCALE);
  if (Math.abs(Number(paidAmount) - cart.total) > tolerance) {
    return {
      error: true,
      message: await t(
        'Paid amount {0} does not match expected amount {1}.',
        String(paidAmount),
        String(cart.total),
      ),
    };
  }

  const productIds = cart.items.map(item => item.productId);

  /* Time-sensitive re-check: between prepare and now (could be minutes
   * via 3-D Secure / external redirects) the buyer may have purchased
   * the same product in another tab, or the publisher may have pulled a
   * version. Block the grant if so. Prices are NOT re-checked here. */
  const recheck = await recheckCartAvailability({
    client,
    workspace: access.workspace,
    mainPartnerId,
    productIds,
  });
  if (recheck.error) return recheck;

  let purchaseIds: string[] = [];
  try {
    await client.$transaction(async txClient => {
      purchaseIds = await recordPurchases(
        txClient,
        mainPartnerId,
        cart.items.map(item => ({
          productId: item.productId,
          priceWt: item.priceWt,
          priceAti: item.priceAti,
          taxRate: item.taxRate,
          currencyCodeISO: item.currencyCodeISO,
        })),
      );
      await markPaymentAsProcessed({
        contextId: paymentContextId,
        version: paymentContextVersion,
        client: txClient,
      });
    });
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error ? e.message : await t('Granting access failed.'),
    };
  }

  const paymentModeId = getPaymentModeId(
    marketplaceConfig.paymentOptionSet,
    parsed.data.payment.mode,
  );

  try {
    const buyerPartner = await findPartnerInvoicingAddresses({
      client,
      mainPartnerId,
    });

    const addressId =
      buyerPartner?.partnerAddressList?.find(addr => addr.isDefaultAddr)?.id ??
      buyerPartner?.partnerAddressList?.[0]?.id;
    if (!addressId) {
      return {
        success: true,
        data: {purchaseIds},
        message: await t(
          'Invoice creation failed: no invoicing address found.',
        ),
      };
    }

    const {invoiceId, saleOrderId} = await createMarketplaceOrder({
      cart,
      workspace: access.workspace,
      mainPartnerId,
      contactId: access.user.isContact ? access.user.id : undefined,
      invoicingAddressId: addressId,
      paidAmount: cart.total,
      paymentModeId,
      config,
    });

    await attachOrderToPurchases(client, mainPartnerId, productIds, {
      invoiceId,
      saleOrderId,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : '';
    console.error('marketplace: invoice creation failed', {
      mainPartnerId,
      productIds,
      paymentContextId,
      error: e,
    });
    return {
      success: true,
      data: {purchaseIds},
      message: reason
        ? await t('Invoice creation failed: {0}', reason)
        : await t('Invoice creation failed.'),
    };
  }

  return {success: true, data: {purchaseIds}};
}
