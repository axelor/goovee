'use server';

import {z} from 'zod';
import {headers} from 'next/headers';

import {SUBAPP_CODES} from '@/constants';
import {TENANT_HEADER} from '@/proxy';
import {t} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {createPaypalOrder} from '@/payment/paypal/actions';
import {createStripeOrder} from '@/payment/stripe/actions';
import {createPayboxOrder} from '@/payment/paybox/actions';
import {PaymentOption} from '@/types';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import {WorkspaceURLSchema} from '@/utils/validators';

import {ensureAuth} from '../utils/auth-helper';
import {validateCart, CartProductIdsSchema} from './cart-validation';

const BaseSchema = z.object({
  productIds: CartProductIdsSchema,
  workspaceURL: WorkspaceURLSchema,
});

const PayboxSchema = BaseSchema.extend({uri: z.string().min(1)});

type Err = {error: true; message: string};
const err = (message: string): Err => ({error: true, message});

/* Per-provider session creators. Each one validates the cart server-side,
 * stashes the validated cart in PaymentContext (via the shared
 * `createXOrder` helpers), and returns the provider's session shape.
 * The unified `checkout()` action (in actions.ts) pulls the cart back
 * from PaymentContext on the return leg. */

async function prepare(input: {productIds: string[]; workspaceURL: string}) {
  const {productIds, workspaceURL} = input;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return err(await t('Tenant ID is missing.'));
  const {auth, error: authError} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (authError) return err(await t('Sign in required.'));
  const {client, config} = auth.tenant;

  const cartResult = await validateCart({
    client,
    workspace: auth.workspace,
    mainPartnerId: auth.user.mainPartnerId,
    productIds,
  });
  if (cartResult.error) return cartResult;
  const cart = cartResult.data;

  const workspace = auth.workspace;
  if (!workspace.config.allowOnlinePaymentForEcommerce) {
    return err(await t('Online payment is not available.'));
  }
  const paymentOptionSet = workspace.config.paymentOptionSet;
  if (!paymentOptionSet?.length) {
    return err(await t('Payment options are not configured.'));
  }

  /* PaymentContext holds the validated cart verbatim. On the return leg
   * `checkout()` trusts these server-stamped prices and only re-checks
   * the time-sensitive invariants (ownership, published version, access). */
  const context = {
    cart,
    workspaceURL,
  };

  return {
    success: true as const,
    data: {auth, config, cart, workspace, paymentOptionSet, context},
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
  const {auth, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.stripe)) {
    return err(await t('Stripe is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.stripe)) {
    return err(await t('Payment mode is not configured for {0}.', 'Stripe'));
  }

  const payer = await findGooveeUserByEmail(
    auth.user.email,
    auth.tenant.client,
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
      customer: {id: String(payerId), email: emailAddress},
      name: await t('Marketplace purchase'),
      amount: cart.total,
      currency: cart.currencyCode,
      context,
      tenantId: auth.tenant.id,
      client: auth.tenant.client,
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
  const {auth, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.paypal)) {
    return err(await t('PayPal is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.paypal)) {
    return err(await t('Payment mode is not configured for {0}.', 'PayPal'));
  }

  const payer = await findGooveeUserByEmail(
    auth.user.email,
    auth.tenant.client,
  );
  const emailAddress = payer?.emailAddress?.address;
  if (!emailAddress) return err(await t('Buyer email could not be resolved.'));

  try {
    const response = await createPaypalOrder({
      amount: cart.total,
      currency: cart.currencyCode,
      email: emailAddress,
      client: auth.tenant.client,
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
  const {auth, cart, paymentOptionSet, context} = prep.data;

  if (!isPaymentOptionAvailable(paymentOptionSet, PaymentOption.paybox)) {
    return err(await t('Paybox is not available.'));
  }
  if (!getPaymentModeId(paymentOptionSet, PaymentOption.paybox)) {
    return err(await t('Payment mode is not configured for {0}.', 'Paybox'));
  }

  const payer = await findGooveeUserByEmail(
    auth.user.email,
    auth.tenant.client,
  );
  const emailAddress = payer?.emailAddress?.address;
  if (!emailAddress) return err(await t('Buyer email could not be resolved.'));

  try {
    const response = await createPayboxOrder({
      amount: cart.total,
      currency: cart.currencyCode,
      email: emailAddress,
      context,
      client: auth.tenant.client,
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
