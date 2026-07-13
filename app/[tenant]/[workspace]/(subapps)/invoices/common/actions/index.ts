'use server';

import {z} from 'zod';
import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {getPublicEnvironment} from '@/environment';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  SUBAPP_CODES,
} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {createPayboxOrder, findPayboxOrder} from '@/payment/paybox/actions';
import {createUp2payOrder} from '@/payment/up2pay/actions';
import {createHubPispPaymentLink} from '@/payment/hubpisp/actions';
import {createPaypalOrder, findPaypalOrder} from '@/payment/paypal/actions';
import {
  createStripePaymentIntent,
  createStripeOrder,
  findStripeOrder,
  findStripePaymentIntent,
  cancelStripePaymentIntent,
  cancelInvalidPendingBankTransfers,
} from '@/payment/stripe/actions';
import {findPaymentContext, markPaymentAsProcessed} from '@/payment/common/orm';
import {PaymentOption} from '@/types';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import {getHubPispTransferTypes} from '@/payment/hubpisp/utils';
import {formatNumber} from '@/lib/core/locale/server/formatters';
import {PAYMENT_SOURCE, PAYMENT_TYPE} from '@/lib/core/payment/common/type';
import {
  CURRENCY_CODE,
  UP2PAY_REDIRECT_STATUS,
} from '@/lib/core/payment/up2pay/constants';
import {
  HUBPISP_LOCAL_INSTRUMENT,
  HUBPISP_REDIRECT_STATUS,
  HUBPISP_TRANSFER_TYPE,
} from '@/lib/core/payment/hubpisp/constants';
import {
  BANK_TRANSFER_STATUS,
  STRIPE_CANCELLATION_REASONS,
} from '@/lib/core/payment/stripe/constants';
import type {CountryCode} from '@/lib/core/payment/stripe/types';
import {scale} from '@/utils';
import {withBasePath} from '@/lib/core/path/base-path';
import {ensureLeadingSlash} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {
  InvoicePaymentSchema,
  InvoicePaymentWithUriSchema,
  InitiatePispPaymentSchema,
  PaypalCaptureOrderSchema,
  ValidateStripePaymentSchema,
  CancelStripeBankTransferSchema,
  ValidatePayboxPaymentSchema,
  type InvoicePaymentInput,
  type InvoicePaymentWithUriInput,
  type InitiatePispPaymentInput,
  type PaypalCaptureOrderInput,
  type ValidateStripePaymentInput,
  type CancelStripeBankTransferInput,
  type ValidatePayboxPaymentInput,
} from '@/subapps/invoices/common/validators';
import {
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {
  resolveInvoicePaymentAccess,
  validatePaymentData,
} from '@/subapps/invoices/common/utils/validations';
import {updateInvoice} from '@/subapps/invoices/common/service';
import {ActionResponse} from '@/types/action';
import {Invoice} from '../types/invoices';

const normalizeAmount = (
  value: string | number,
  decimals = DEFAULT_CURRENCY_SCALE,
) => Number(scale(Number(value), decimals));

export async function paypalCreateOrder({
  invoice,
  amount,
  workspaceURL,
  token,
}: InvoicePaymentInput) {
  const parsed = InvoicePaymentSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {$amount, $invoice} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;
  const allowPaypal = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.paypal,
  );
  if (!allowPaypal) {
    return {
      error: true,
      message: await t('Paypal is not available'),
    };
  }

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.paypal);

  const payerEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user!.email;

  if (!payerEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;

  try {
    const response = await createPaypalOrder({
      client,
      tenantId,
      amount: $amount,
      currency: currencyCode,
      context: {
        ...invoice,
        paymentModeId,
      },
      email: payerEmail,
    });
    return {success: true, order: response?.result};
  } catch (err) {
    console.error('Error:', err);
    return {
      error: true,
      message: await t((err as Error)?.message),
    };
  }
}

export async function paypalCaptureOrder({
  orderID,
  workspaceURL,
  token,
}: PaypalCaptureOrderInput): ActionResponse<Invoice> {
  const parsed = PaypalCaptureOrderSchema.safeParse({
    orderID,
    workspaceURL,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('Tenant is missing'),
    };
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, invoiceFilter} = access.data;
  const {client} = tenant;

  if (config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
    return {
      error: true,
      message: await t('Payment not allowed'),
    };
  }

  if (!config.allowOnlinePaymentForInvoices) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const paymentOptions = config.paymentOptionSet;
  if (!paymentOptions?.length) {
    return {
      error: true,
      message: await t('Payment options are not configured'),
    };
  }

  const allowPaypal = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.paypal,
  );
  if (!allowPaypal) {
    return {
      error: true,
      message: await t('Paypal is not available'),
    };
  }

  try {
    const {amount, context} = await findPaypalOrder({
      id: orderID,
      tenantId,
      client,
    });

    const invoice = context.data;

    const purchaseAmount = Number(amount);

    if (purchaseAmount <= 0) {
      return {
        error: true,
        message: await t('Payment amount must be greater than zero.'),
      };
    }

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: invoice.id,
      ...invoiceFilter,
      workspaceURL,
      tenantId,
      client,
    });

    if (!$invoice) {
      return {
        error: true,
        message: await t('Invalid invoice'),
      };
    }

    const remainingAmount = normalizeAmount(
      $invoice.amountRemaining?.value ?? 0,
      $invoice.currency?.numberOfDecimals
        ? Number($invoice.currency.numberOfDecimals)
        : undefined,
    );

    const isPartialPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

    if (isTotalPayment && purchaseAmount !== remainingAmount) {
      return {
        error: true,
        message: await t('Payment must match the total amount'),
      };
    } else if (isPartialPayment && purchaseAmount > remainingAmount) {
      return {
        error: true,
        message: await t('Payment exceeds the remaining amount.'),
      };
    }

    const updatedInvoice = await updateInvoice({
      config: tenant.config,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
      paymentModeId: context?.data?.paymentModeId,
    });
    if (updatedInvoice.error) {
      return {
        error: true,
        message:
          updatedInvoice.message ||
          (await t('Something went wrong while updating invoice!')),
      };
    }
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      client,
    });
    return {success: true, data: $invoice};
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      error: true,
      message: await t('An error occurred while processing the payment.'),
    };
  }
}

export async function createStripeCheckoutSession({
  invoice,
  amount,
  workspaceURL,
  token,
}: InvoicePaymentInput) {
  const parsed = InvoicePaymentSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {$amount, $invoice, isPartialPayment} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;

  const allowStripe = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.stripe,
  );
  if (!allowStripe) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  const stripeEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user!.email;

  if (!stripeEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const customer = {
    id: token ? String($invoice.partner?.id) : String(user!.id),
    email: stripeEmail,
  };

  const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.stripe);

  try {
    const session = await createStripeOrder({
      tenantId,
      client,
      customer,
      context: {
        id: $invoice.id,
        paymentType: PAYMENT_TYPE.CARD,
        source: PAYMENT_SOURCE.INVOICES,
        paymentModeId,
      },
      name: await t('Invoice Checkout'),
      amount: Number($amount),
      currency: currencyCode,
      url: {
        success: `${workspaceURL}/${SUBAPP_CODES.invoices}/${$invoice.id}?stripe_session_id={CHECKOUT_SESSION_ID}&type=${isPartialPayment ? INVOICE_PAYMENT_OPTIONS.PARTIAL : INVOICE_PAYMENT_OPTIONS.TOTAL}${token ? `&token=${token}` : ''}`,
        error: `${workspaceURL}/${SUBAPP_CODES.invoices}/${$invoice.id}?stripe_error=true${token ? `&token=${token}` : ''}`,
      },
    });

    return {
      client_secret: session.client_secret,
      url: session.url,
    };
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    return {
      error: true,
      message: await t((err as Error)?.message),
    };
  }
}

export async function validateStripePayment({
  stripeSessionId,
  workspaceURL,
  workspaceURI,
  token,
}: ValidateStripePaymentInput) {
  const parsed = ValidateStripePaymentSchema.safeParse({
    stripeSessionId,
    workspaceURL,
    workspaceURI,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, invoiceFilter} = access.data;
  const {client} = tenant;

  try {
    if (!config.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = config.paymentOptionSet;
    if (!paymentOptions?.length) {
      return {
        error: true,
        message: await t('Payment options not selected!'),
      };
    }

    const allowStripe = isPaymentOptionAvailable(
      paymentOptions,
      PaymentOption.stripe,
    );
    if (!allowStripe) {
      return {
        error: true,
        message: await t('Stripe is not available'),
      };
    }

    let invoice, purchaseAmount, context;
    try {
      const order = await findStripeOrder({
        id: stripeSessionId,
        tenantId,
        client,
      });
      invoice = order.context.data;
      purchaseAmount = order.amount;
      context = order.context;
    } catch (err) {
      return {
        error: true,
        message: await t((err as Error)?.message),
      };
    }

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: invoice.id,
      ...invoiceFilter,
      workspaceURL,
      tenantId,
      client,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    const remainingAmount = normalizeAmount(
      $invoice.amountRemaining?.value ?? 0,
      $invoice.currency?.numberOfDecimals
        ? Number($invoice.currency.numberOfDecimals)
        : undefined,
    );

    const isPartialPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

    if (isTotalPayment && purchaseAmount !== remainingAmount) {
      return {
        error: true,
        message: await t('Payment must match the total amount'),
      };
    } else if (isPartialPayment && purchaseAmount > remainingAmount) {
      return {
        error: true,
        message: await t('Payment exceeds the remaining amount.'),
      };
    }

    const result = await updateInvoice({
      config: tenant.config,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
      paymentModeId: context?.data?.paymentModeId,
    });

    if (result.error) {
      return {
        error: true,
        message:
          result.message ||
          (await t('Something went wrong while updating invoice!')),
      };
    }

    await client.$transaction(async txClient => {
      await markPaymentAsProcessed({
        contextId: context.id,
        version: context.version,
        client: txClient,
      });

      /* After a successful card payment, re-fetch the invoice to get the updated
       * amount remaining, then clean up any stale pending bank transfer intents.
       * This handles the case where the customer had previously initiated one or
       * more bank transfers but paid via another method (card) instead. */
      const updatedInvoice = await findInvoice({
        id: $invoice.id,
        ...invoiceFilter,
        workspaceURL,
        tenantId,
        client: txClient,
      });

      if (updatedInvoice) {
        const updatedAmountRemaining = normalizeAmount(
          updatedInvoice.amountRemaining?.value ?? 0,
          updatedInvoice.currency?.numberOfDecimals
            ? Number(updatedInvoice.currency.numberOfDecimals)
            : undefined,
        );

        /* Cancel any pending bank transfer intents that are now invalid:
         * - If amountRemaining === 0, the invoice is fully paid → cancel as DUPLICATE
         * - If amountRemaining > 0 but an intent exceeds what's still owed
         *   (e.g. a partial card payment was made) → cancel as REQUESTED_BY_CUSTOMER */
        await cancelInvalidPendingBankTransfers({
          client: txClient,
          sourceId: String(updatedInvoice.id),
          amountRemaining: updatedAmountRemaining,
          tenantId,
        });
      }
    });

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.invoices}/${$invoice.id}`);
    return {success: true, data: $invoice};
  } catch (error) {
    console.error('Error validating Stripe payment:', error);
    return {
      error: true,
      message: await t('An error occurred while processing the payment.'),
    };
  }
}

export async function createStripeBankTransferIntent({
  invoice,
  amount,
  workspaceURL,
  token,
}: InvoicePaymentInput) {
  const parsed = InvoicePaymentSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {$amount, $invoice} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;

  const allowStripe = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.stripe,
  );
  if (!allowStripe) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  const stripeEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user!.email;

  if (!stripeEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const customer = {
    id: token ? String($invoice.partner?.id) : String(user!.id),
    email: stripeEmail,
  };

  const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;
  const currencySymbol = $invoice.currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = $invoice.currency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const country = $invoice.company?.address?.country;

  const formattedAmount = await formatNumber($amount, {
    scale,
    currency: currencySymbol,
    type: 'DECIMAL',
  });

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.stripe);

  try {
    const result = await createStripePaymentIntent({
      tenantId,
      client,
      customer,
      context: {
        id: invoice.id,
        paymentType: PAYMENT_TYPE.BANK_TRANSFER,
        source: PAYMENT_SOURCE.INVOICES,
        paymentModeId,
      },
      amount: Number($amount),
      currency: currencyCode,
      countryCode: country?.alpha2Code as CountryCode,
    });

    if (result.status === BANK_TRANSFER_STATUS.PAID) {
      return {success: true, data: result};
    }

    return {success: true, data: {...result, formattedAmount}};
  } catch (error) {
    console.error('Error creating stripe bank transfer payment intent:', error);

    const message =
      (error as Error & {raw?: {message?: string}})?.raw?.message ||
      (error as Error)?.message ||
      'Failed to create bank transfer';

    return {
      error: true,
      message: await t(message),
    };
  }
}

export async function cancelStripeBankTransferPaymentIntent({
  id,
  contextId,
  workspaceURL,
  workspaceURI,
  token,
}: CancelStripeBankTransferInput) {
  const parsed = CancelStripeBankTransferSchema.safeParse({
    id,
    contextId,
    workspaceURL,
    workspaceURI,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const $headers = await headers();
  const tenantId = $headers.get(TENANT_HEADER);

  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, invoiceFilter} = access.data;
  const {client} = tenant;

  try {
    if (!config.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = config.paymentOptionSet;
    if (!paymentOptions?.length) {
      return {
        error: true,
        message: await t('Payment options not selected!'),
      };
    }

    const allowStripe = isPaymentOptionAvailable(
      paymentOptions,
      PaymentOption.stripe,
    );
    if (!allowStripe) {
      return {
        error: true,
        message: await t('Stripe is not available'),
      };
    }

    let context;
    try {
      const paymentIntent = await findStripePaymentIntent(id, tenantId);
      context = paymentIntent.metadata.context_id;
    } catch (err) {
      return {
        error: true,
        message: await t((err as Error)?.message),
      };
    }
    const paymentContext = await findPaymentContext({
      id: context,
      client,
      mode: PaymentOption.stripe,
      ignoreExpiration: true,
    });

    if (!paymentContext) {
      return {
        error: true,
        message: await t('Context not found'),
      };
    }

    const {data} = paymentContext;

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: data.id,
      ...invoiceFilter,
      workspaceURL,
      tenantId,
      client,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    await cancelStripePaymentIntent({
      id,
      cancellationReason: STRIPE_CANCELLATION_REASONS.REQUESTED_BY_CUSTOMER,
      tenantId,
      client,
    });

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.invoices}/${$invoice.id}`);
    return {success: true, data: null};
  } catch (error) {
    console.error('Error Cancelling:', error);
    return {
      error: true,
      message: await t('An error occurred while processing the payment.'),
    };
  }
}

export async function payboxCreateOrder({
  invoice,
  amount,
  workspaceURL,
  uri,
  token,
}: InvoicePaymentWithUriInput) {
  const parsed = InvoicePaymentWithUriSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    uri,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {$amount, $invoice, isPartialPayment} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;

  const allowPaybox = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.paybox,
  );
  if (!allowPaybox) {
    return {
      error: true,
      message: await t('Stripe is not available'),
    };
  }

  const payerEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user!.email;

  if (!payerEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.paybox);

  try {
    const response = await createPayboxOrder({
      client,
      tenantId,
      amount: $amount,
      currency: currencyCode,
      email: payerEmail,
      context: {
        ...invoice,
        paymentModeId,
      },
      url: {
        success: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_response=true&type=${isPartialPayment ? INVOICE_PAYMENT_OPTIONS.PARTIAL : INVOICE_PAYMENT_OPTIONS.TOTAL}${token ? `&token=${token}` : ''}`))}`,
        failure: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?paybox_error=true${token ? `&token=${token}` : ''}`))}`,
      },
    });

    return {success: true, order: response};
  } catch (err) {
    return {
      error: true,
      message: await t((err as Error)?.message),
    };
  }
}

export async function validatePayboxPayment({
  params,
  workspaceURL,
  workspaceURI,
  token,
}: ValidatePayboxPaymentInput) {
  const parsed = ValidatePayboxPaymentSchema.safeParse({
    params,
    workspaceURL,
    workspaceURI,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, invoiceFilter} = access.data;
  const {client} = tenant;

  try {
    if (!config.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = config.paymentOptionSet;
    if (!paymentOptions?.length) {
      return {
        error: true,
        message: await t('Payment options not selected!'),
      };
    }

    const allowPaybox = isPaymentOptionAvailable(
      paymentOptions,
      PaymentOption.paybox,
    );
    if (!allowPaybox) {
      return {
        error: true,
        message: await t('Stripe is not available'),
      };
    }

    let invoice, purchaseAmount, context;
    try {
      const order = await findPayboxOrder({params, client});

      invoice = order.context.data;
      purchaseAmount = order.amount;
      context = order.context;
    } catch (err) {
      console.error('Error:', err);
      return {
        error: true,
        message: await t((err as Error)?.message),
      };
    }

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: invoice.id,
      ...invoiceFilter,
      workspaceURL,
      tenantId,
      client,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    const remainingAmount = normalizeAmount(
      $invoice.amountRemaining?.value ?? 0,
      $invoice.currency?.numberOfDecimals
        ? Number($invoice.currency.numberOfDecimals)
        : undefined,
    );

    const isPartialPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

    if (isTotalPayment && purchaseAmount !== remainingAmount) {
      return {
        error: true,
        message: await t('Payment must match the total amount'),
      };
    } else if (isPartialPayment && purchaseAmount > remainingAmount) {
      return {
        error: true,
        message: await t('Payment exceeds the remaining amount.'),
      };
    }

    const result = await updateInvoice({
      config: tenant.config,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
      paymentModeId: context?.data?.paymentModeId,
    });

    if (result.error) {
      return {
        error: true,
        message:
          result.message ||
          (await t('Something went wrong while updating invoice!')),
      };
    }
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      client,
    });
    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.invoices}/${$invoice.id}`);
    return {success: true, data: $invoice};
  } catch (error) {
    console.error('Error validating Paybox payment:', error);
    return {
      error: true,
      message: await t('An error occurred while processing the payment.'),
    };
  }
}

export async function up2payCreateOrder({
  invoice,
  amount,
  workspaceURL,
  uri,
  token,
}: InvoicePaymentWithUriInput) {
  const parsed = InvoicePaymentWithUriSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    uri,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });

  if (validationResult.error) {
    return validationResult;
  }
  const {$amount, $invoice, isPartialPayment} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;

  const allowUp2pay = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.up2pay,
  );
  if (!allowUp2pay) {
    return {
      error: true,
      message: await t('Up2Pay is not available'),
    };
  }

  const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;
  if (!CURRENCY_CODE[currencyCode]) {
    return {
      error: true,
      message: await t(
        'Up2Pay only supports EUR. Your invoice currency is not supported.',
      ),
    };
  }

  const up2payEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user!.email;

  if (!up2payEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const billingInfo = {
    firstName: $invoice.partner?.firstName || '',
    lastName: $invoice.partner?.name || '',
    addressLine1: $invoice.address?.addressl4 || '',
    zipCode: $invoice.address?.zip || '',
    city: $invoice.address?.city?.name || '',
    // Up2Pay PBX_BILLING expects the ISO 3166-1 numeric country code (e.g. "250" for France), not the alpha-2 code.
    countryCode: $invoice?.address?.country?.numericCode || '',
  };

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.up2pay);

  try {
    const response = await createUp2payOrder({
      tenantId,
      client,
      amount: $amount,
      currency: currencyCode,
      email: up2payEmail,
      name: $invoice.partner?.name || '',
      reference: $invoice.invoiceId!,
      context: {
        id: invoice.id,
        source: PAYMENT_SOURCE.INVOICES,
        amount: Number($amount),
        paymentModeId,
      },
      billingInfo,
      url: {
        success: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(
          ensureLeadingSlash(
            `${uri}?status=${UP2PAY_REDIRECT_STATUS.SUCCESS}&type=${
              isPartialPayment
                ? INVOICE_PAYMENT_OPTIONS.PARTIAL
                : INVOICE_PAYMENT_OPTIONS.TOTAL
            }${token ? `&token=${token}` : ''}`,
          ),
        )}`,
        failure: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?status=${UP2PAY_REDIRECT_STATUS.REFUSED}${token ? `&token=${token}` : ''}`))}`,
        cancel: `${getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST}${withBasePath(ensureLeadingSlash(`${uri}?status=${UP2PAY_REDIRECT_STATUS.CANCELLED}${token ? `&token=${token}` : ''}`))}`,
      },
    });

    return {success: true, order: response};
  } catch (error) {
    console.error('[UP2PAY][CREATE ORDER] ', error);
    return {
      error: true,
      message: await t((error as Error)?.message),
    };
  }
}

export async function initiatePispPayment({
  invoice,
  amount,
  workspaceURL,
  uri,
  localInstrument,
  token,
}: InitiatePispPaymentInput) {
  const parsed = InitiatePispPaymentSchema.safeParse({
    invoice,
    amount,
    workspaceURL,
    uri,
    localInstrument,
    token,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const access = await resolveInvoicePaymentAccess({
    workspaceURL,
    tenantId,
    token,
  });
  if (access.error) {
    return access;
  }
  const {tenant, config, user, invoiceFilter} = access.data;
  const {client} = tenant;

  const validationResult = await validatePaymentData({
    config,
    client,
    invoice,
    amount,
    invoiceFilter,
    workspaceURL,
    tenantId,
  });

  if (validationResult.error) {
    return validationResult;
  }

  const {$amount, $invoice} = validationResult.data;

  const paymentOptions = config.paymentOptionSet;

  const allowHubPisp = isPaymentOptionAvailable(
    paymentOptions,
    PaymentOption.hubpisp,
  );
  if (!allowHubPisp) {
    return {
      error: true,
      message: await t('HUB PISP is not available'),
    };
  }

  const allowedTransferTypes = getHubPispTransferTypes(paymentOptions);
  if (!allowedTransferTypes.length) {
    return {
      error: true,
      message: await t('No HUB PISP transfer type is configured.'),
    };
  }

  const requestedTransferType =
    localInstrument === HUBPISP_LOCAL_INSTRUMENT.INST
      ? HUBPISP_TRANSFER_TYPE.INSTANT
      : HUBPISP_TRANSFER_TYPE.STANDARD;

  if (!allowedTransferTypes.includes(requestedTransferType)) {
    return {
      error: true,
      message: await t('Selected transfer type is not allowed'),
    };
  }

  const host = getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST;
  const tokenSuffix = token ? `&token=${token}` : '';

  const successfulReportUrl = `${host}${withBasePath(ensureLeadingSlash(`${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.SUCCESS}${tokenSuffix}`))}`;
  const unsuccessfulReportUrl = `${host}${withBasePath(ensureLeadingSlash(`${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.CANCELLED}${tokenSuffix}`))}`;

  const pageConsentInfo = {
    pageTimeout: 1200,
    pageTimeoutUnit: 'SECONDS' as const,
    pageUserTimeout: 300,
    pageUserTimeoutUnit: 'SECONDS' as const,
    pageTimeOutReturnURL: `${host}${withBasePath(ensureLeadingSlash(`${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.EXPIRED}${tokenSuffix}`))}`,
  };

  const pispEmail = token
    ? $invoice.partner?.emailAddress?.address
    : user?.email;

  if (!pispEmail) {
    return {
      error: true,
      message: await t('Email is required for payment'),
    };
  }

  const paymentModeId = getPaymentModeId(paymentOptions, PaymentOption.hubpisp);

  try {
    const psuInfo = {
      name: [$invoice?.partner?.firstName, $invoice?.partner?.name]
        .filter(Boolean)
        .join(' '),
    };
    const currencyCode = $invoice.currency?.code || DEFAULT_CURRENCY_CODE;
    const response = await createHubPispPaymentLink({
      amount: Number($amount),
      tenantId,
      client,
      email: pispEmail,
      context: {
        id: invoice.id,
        source: PAYMENT_SOURCE.INVOICES,
        amount: Number($amount),
        localInstrument: localInstrument ?? HUBPISP_LOCAL_INSTRUMENT.SCT,
        paymentModeId,
      },
      currency: currencyCode,
      remittanceInformation: `Invoice-${invoice.id}`,
      successfulReportUrl,
      unsuccessfulReportUrl,
      pageConsentInfo,
      psuInfo,
      localInstrument,
    });

    return {
      success: true,
      order: {
        consentHref: response.consentHref,
        resourceId: response.resourceId,
        contextId: response.contextId,
      },
    };
  } catch (error) {
    console.error('[HUBPISP][CREATE ORDER] ', error);
    return {
      error: true,
      message: await t((error as Error)?.message),
    };
  }
}
