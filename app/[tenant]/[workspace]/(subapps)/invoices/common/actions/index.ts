'use server';

import {headers} from 'next/headers';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  SUBAPP_CODES,
} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {createPayboxOrder, findPayboxOrder} from '@/payment/paybox/actions';
import {createUp2payOrder} from '@/payment/up2pay/actions';
import {createHubPispPaymentLink} from '@/payment/hubpisp/actions';
import {createPaypalOrder, findPaypalOrder} from '@/payment/paypal/actions';
import {
  createStripePaymentIntent,
  createStripeOrder,
  findStripeOrder,
  findStripePaymentIntent,
} from '@/payment/stripe/actions';
import {
  findPaymentContext,
  markPaymentAsCancelled,
  markPaymentAsProcessed,
} from '@/payment/common/orm';
import {PartnerKey, PaymentOption} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {isPaymentOptionAvailable} from '@/utils/payment';
import {stripe} from '@/lib/core/payment/stripe';
import {formatNumber} from '@/lib/core/locale/server/formatters';
import {PAYMENT_SOURCE, PAYMENT_TYPE} from '@/lib/core/payment/common/type';
import {
  CURRENCY_CODE,
  UP2PAY_REDIRECT_STATUS,
} from '@/lib/core/payment/up2pay/constants';
import {
  HUBPISP_LOCAL_INSTRUMENT,
  HUBPISP_REDIRECT_STATUS,
  HubPispLocalInstrument,
} from '@/lib/core/payment/hubpisp/constants';

// ---- LOCAL IMPORTS ---- //
import {
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {validatePaymentData} from '@/subapps/invoices/common/utils/validations';
import {updateInvoice} from '@/subapps/invoices/common/service';

export async function paypalCreateOrder({
  invoice,
  amount,
  workspaceURL,
  token,
}: {
  invoice: {
    id: string | number;
  };
  amount: string;
  workspaceURL: string;
  token?: string;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {workspace, user, $amount, $invoice} = validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;
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

  const payerEmail = token
    ? $invoice?.partner?.emailAddress?.address
    : user!.email;

  const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;

  try {
    const response = await createPaypalOrder({
      tenantId,
      amount: $amount,
      currency: currencyCode,
      context: invoice,
      email: payerEmail,
    });
    return {success: true, order: response?.result};
  } catch (err) {
    console.error('Error:', err);
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function paypalCaptureOrder({
  orderID,
  workspaceURL,
  token,
}: {
  orderID: string;
  workspaceURL: string;
  token?: string;
}) {
  if (!orderID) {
    return {error: true, message: await t('Order ID is missing')};
  }

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Workspace not provided'),
    };
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('Tenant is missing'),
    };
  }

  let user;
  let invoicesWhereClause = {};

  if (!token) {
    const session = await getSession();
    user = session?.user;
    if (!user) {
      return {
        error: true,
        message: await t('Unauthorized'),
      };
    }
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  if (!token) {
    const subapp = await findSubappAccess({
      code: SUBAPP_CODES.invoices,
      user,
      url: workspace.url,
      tenantId,
    });
    if (!subapp) {
      return {
        error: true,
        message: await t('Unauthorized app access'),
      };
    }

    const {role, isContactAdmin} = subapp;
    invoicesWhereClause = getWhereClauseForEntity({
      user,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
  }

  if (workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
    return {
      error: true,
      message: await t('Payment not allowed'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForInvoices) {
    return {
      error: true,
      message: await t('Online payment is not available'),
    };
  }

  const paymentOptions = workspace?.config?.paymentOptionSet;
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
      ...(token ? {token} : {params: {where: invoicesWhereClause}}),
      workspaceURL,
      tenantId,
    });

    if (!$invoice) {
      return {
        error: true,
        message: await t('Invalid invoice'),
      };
    }

    const remainingAmount = Number($invoice.amountRemaining?.value || 0);

    const isPartialPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

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
      tenantId,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
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
      tenantId,
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
}: {
  invoice: any;
  amount: string;
  workspaceURL: string;
  token?: string;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }
  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {workspace, user, $amount, $invoice, isPartialPayment} =
    validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;

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

  let customer: {id: string; email: string};
  if (token) {
    customer = {
      id: String($invoice?.partner?.id),
      email: $invoice?.partner?.emailAddress?.address,
    };
  } else {
    customer = {id: String(user!.id), email: user!.email};
  }

  const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;

  try {
    const session = await createStripeOrder({
      tenantId,
      customer,
      context: {id: invoice.id, paymentType: PAYMENT_TYPE.CARD},
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
      message: await t((err as any)?.message),
    };
  }
}

export async function validateStripePayment({
  stripeSessionId,
  workspaceURL,
  workspaceURI,
  token,
}: {
  stripeSessionId: string;
  workspaceURL: string;
  workspaceURI: string;
  token?: string;
}) {
  if (!stripeSessionId) {
    return {error: true, message: await t('Missing stripe session id!')};
  }

  if (!workspaceURL) {
    return {error: true, message: await t('Workspace not provided!')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  try {
    let user;
    let invoicesWhereClause = {};

    if (!token) {
      const session = await getSession();
      user = session?.user;
      if (!user) {
        return {error: true, message: await t('Unauthorized')};
      }
    }

    const workspace = await findWorkspace({
      url: workspaceURL,
      tenantId,
      user,
    });

    if (!workspace) {
      return {error: true, message: await t('Invalid workspace')};
    }

    if (!token) {
      const subapp = await findSubappAccess({
        code: SUBAPP_CODES.invoices,
        user,
        url: workspace.url,
        tenantId,
      });

      if (!subapp) {
        return {error: true, message: await t('Unauthorized app access')};
      }

      invoicesWhereClause = getWhereClauseForEntity({
        user,
        role: subapp.role,
        isContactAdmin: subapp.isContactAdmin,
        partnerKey: PartnerKey.PARTNER,
      });
    }

    if (!workspace?.config?.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = workspace?.config?.paymentOptionSet;
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
      });
      invoice = order.context.data;
      purchaseAmount = order.amount;
      context = order.context;
    } catch (err) {
      return {
        error: true,
        message: await t((err as any)?.message),
      };
    }

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: invoice.id,
      ...(token ? {token} : {params: {where: invoicesWhereClause}}),
      workspaceURL,
      tenantId,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    const remainingAmount = Number($invoice.amountRemaining?.value || 0);

    const isPartialPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

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
      tenantId,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
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
      tenantId,
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
}: {
  invoice: any;
  amount: string;
  workspaceURL: string;
  token?: string;
}) {
  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }
  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {workspace, user, $amount, $invoice} = validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;

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

  let customer: {id: string; email: string};
  if (token) {
    customer = {
      id: String($invoice?.partner?.id),
      email: $invoice?.partner?.emailAddress?.address,
    };
  } else {
    customer = {id: String(user!.id), email: user!.email};
  }

  const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;
  const currencySymbol = $invoice?.currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = $invoice?.currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const country = $invoice.company.address.country;

  const formattedAmount = await formatNumber($amount, {
    scale,
    currency: currencySymbol,
    type: 'DECIMAL',
  });

  try {
    const result = await createStripePaymentIntent({
      tenantId,
      customer,
      context: {
        id: invoice.id,
        paymentType: PAYMENT_TYPE.BANK_TRANSFER,
        source: PAYMENT_SOURCE.INVOICES,
      },
      amount: Number($amount),
      currency: currencyCode,
      countryCode: country.alpha2Code,
    });
    return {success: true, data: {...result, formattedAmount}};
  } catch (error) {
    console.error('Error creating stripe bank transfer payment intent:', error);

    const message =
      error?.raw?.message || error?.message || 'Failed to create bank transfer';

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
}: {
  id: string;
  contextId: string;
  workspaceURL: string;
  workspaceURI: string;
  token?: string;
}) {
  if (!id) {
    return {error: true, message: await t('Missing stripe payment id!')};
  }

  if (!contextId) {
    return {error: true, message: await t('Missing payment context id!')};
  }

  if (!workspaceURL) {
    return {error: true, message: await t('Workspace not provided!')};
  }
  const $headers = await headers();
  const tenantId = $headers.get(TENANT_HEADER);

  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  try {
    let user;
    let invoicesWhereClause = {};

    if (!token) {
      const session = await getSession();
      user = session?.user;
      if (!user) {
        return {error: true, message: await t('Unauthorized')};
      }
    }

    const workspace = await findWorkspace({user, url: workspaceURL, tenantId});

    if (!workspace) {
      return {error: true, message: await t('Invalid workspace')};
    }

    if (!token) {
      const subapp = await findSubappAccess({
        code: SUBAPP_CODES.invoices,
        user,
        url: workspace.url,
        tenantId,
      });

      if (!subapp) {
        return {error: true, message: await t('Unauthorized app access')};
      }

      invoicesWhereClause = getWhereClauseForEntity({
        user,
        role: subapp.role,
        isContactAdmin: subapp.isContactAdmin,
        partnerKey: PartnerKey.PARTNER,
      });
    }

    if (!workspace?.config?.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = workspace?.config?.paymentOptionSet;
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
      const paymentIntent = await findStripePaymentIntent(id);
      context = paymentIntent.metadata.context_id;
    } catch (err) {
      return {
        error: true,
        message: await t((err as any)?.message),
      };
    }
    const paymentContext = await findPaymentContext({
      id: context,
      tenantId,
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
      ...(token ? {token} : {params: {where: invoicesWhereClause}}),
      workspaceURL,
      tenantId,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    await markPaymentAsCancelled({
      contextId: paymentContext.id,
      version: paymentContext.version,
      tenantId,
    });

    await stripe.paymentIntents.cancel(id, {
      cancellation_reason: 'requested_by_customer',
    });

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.invoices}/${$invoice.id}`);
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
}: {
  invoice: any;
  amount: string;
  workspaceURL: string;
  uri: string;
  token?: string;
}) {
  if (!uri) {
    return {
      error: true,
      message: await t('Payment gateway URI is missing'),
    };
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });
  if (validationResult.error) {
    return validationResult;
  }
  const {workspace, user, $amount, $invoice, isPartialPayment} =
    validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;

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
    ? $invoice?.partner?.emailAddress?.address
    : user!.email;

  const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;
  try {
    const response = await createPayboxOrder({
      tenantId,
      amount: $amount,
      currency: currencyCode,
      email: payerEmail,
      context: invoice,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_response=true&type=${isPartialPayment ? INVOICE_PAYMENT_OPTIONS.PARTIAL : INVOICE_PAYMENT_OPTIONS.TOTAL}${token ? `&token=${token}` : ''}`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}/${uri}?paybox_error=true${token ? `&token=${token}` : ''}`,
      },
    });

    return {success: true, order: response};
  } catch (err) {
    return {
      error: true,
      message: await t((err as any)?.message),
    };
  }
}

export async function validatePayboxPayment({
  params,
  workspaceURL,
  workspaceURI,
  token,
}: {
  params: any;
  workspaceURL: string;
  workspaceURI: string;
  token?: string;
}) {
  if (!params) {
    return {error: true, message: await t('Bad request')};
  }

  if (!workspaceURL) {
    return {error: true, message: await t('Workspace not provided!')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Invalid tenant')};
  }

  try {
    let user;
    let invoicesWhereClause = {};

    if (!token) {
      const session = await getSession();
      user = session?.user;
      if (!user) {
        return {error: true, message: await t('Unauthorized')};
      }
    }

    const workspace = await findWorkspace({
      url: workspaceURL,
      tenantId,
      user,
    });

    if (!workspace) {
      return {error: true, message: await t('Invalid workspace')};
    }

    if (!token) {
      const subapp = await findSubappAccess({
        code: SUBAPP_CODES.invoices,
        user,
        url: workspace.url,
        tenantId,
      });

      if (!subapp) {
        return {error: true, message: await t('Unauthorized app access')};
      }

      invoicesWhereClause = getWhereClauseForEntity({
        user,
        role: subapp.role,
        isContactAdmin: subapp.isContactAdmin,
        partnerKey: PartnerKey.PARTNER,
      });
    }

    if (!workspace?.config?.allowOnlinePaymentForInvoices) {
      return {
        error: true,
        message: await t('Online payment is not available'),
      };
    }

    if (workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
      return {
        error: true,
        message: await t('Invoice payment not allowed'),
      };
    }

    const paymentOptions = workspace?.config?.paymentOptionSet;
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
      const order = await findPayboxOrder({params, tenantId});

      invoice = order.context.data;
      purchaseAmount = order.amount;
      context = order.context;
    } catch (err) {
      console.error('Error:', err);
      return {
        error: true,
        message: await t((err as any)?.message),
      };
    }

    const $invoice = await findInvoice({
      type: INVOICE.UNPAID,
      id: invoice.id,
      ...(token ? {token} : {params: {where: invoicesWhereClause}}),
      workspaceURL,
      tenantId,
    });

    if (!$invoice) {
      return {error: true, message: await t('Invalid invoice!')};
    }

    const remainingAmount = Number($invoice.amountRemaining?.value || 0);

    const isPartialPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
    const isTotalPayment =
      workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

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
      tenantId,
      amount: purchaseAmount,
      invoiceId: $invoice.id,
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
      tenantId,
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
}: {
  invoice: any;
  amount: string;
  workspaceURL: string;
  uri: string;
  token?: string;
}) {
  if (!uri) {
    return {
      error: true,
      message: await t('Payment gateway URI is missing'),
    };
  }
  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });

  if (validationResult.error) {
    return validationResult;
  }
  const {workspace, user, $amount, $invoice, isPartialPayment} =
    validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;

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

  const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;
  if (!CURRENCY_CODE[currencyCode]) {
    return {
      error: true,
      message: await t(
        'Up2Pay only supports EUR. Your invoice currency is not supported.',
      ),
    };
  }

  const billingInfo = {
    firstName: $invoice?.partner?.firstName || '',
    lastName: $invoice?.partner?.name || '',
    addressLine1: $invoice?.address?.addressl4 || '',
    zipCode: $invoice?.address?.zip || '',
    city: $invoice?.address?.city?.name || '',
    countryCode: $invoice?.address?.country?.alpha2Code || '',
  };

  try {
    const response = await createUp2payOrder({
      tenantId,
      amount: $amount,
      currency: currencyCode,
      email: token ? $invoice?.partner?.emailAddress?.address : user!.email,
      name: $invoice?.partner?.name || '',
      reference: $invoice?.invoiceId,
      context: {
        id: invoice.id,
        source: PAYMENT_SOURCE.INVOICES,
        amount: Number($amount),
      },
      billingInfo,
      url: {
        success: `${process.env.GOOVEE_PUBLIC_HOST}${uri}?status=${UP2PAY_REDIRECT_STATUS.SUCCESS}&type=${
          isPartialPayment
            ? INVOICE_PAYMENT_OPTIONS.PARTIAL
            : INVOICE_PAYMENT_OPTIONS.TOTAL
        }${token ? `&token=${token}` : ''}`,
        failure: `${process.env.GOOVEE_PUBLIC_HOST}${uri}?status=${UP2PAY_REDIRECT_STATUS.REFUSED}${token ? `&token=${token}` : ''}`,
        cancel: `${process.env.GOOVEE_PUBLIC_HOST}${uri}?status=${UP2PAY_REDIRECT_STATUS.CANCELLED}${token ? `&token=${token}` : ''}`,
      },
    });

    return {success: true, order: response};
  } catch (error) {
    console.error('[UP2PAY][CREATE ORDER] ', error);
    return {
      error: true,
      message: await t((error as any)?.message),
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
}: {
  invoice: any;
  amount: string;
  workspaceURL: string;
  uri: string;
  localInstrument?: HubPispLocalInstrument;
  token?: string;
}) {
  if (!uri) {
    return {
      error: true,
      message: await t('Payment gateway URI is missing'),
    };
  }

  if (!invoice?.id) {
    return {
      error: true,
      message: await t('Invoice is missing'),
    };
  }

  if (!amount) {
    return {
      error: true,
      message: await t('Amount is missing'),
    };
  }

  const $headers = await headers();

  const tenantId = $headers.get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('Tenant is missing')};
  }

  const validationResult = await validatePaymentData({
    invoice,
    amount,
    workspaceURL,
    tenantId,
    token,
  });

  if (validationResult.error) {
    return validationResult;
  }

  const {workspace, user, $amount, $invoice} = validationResult.data;

  const paymentOptions = workspace?.config?.paymentOptionSet;

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

  const host = process.env.GOOVEE_PUBLIC_HOST;
  const tokenSuffix = token ? `&token=${token}` : '';

  const successfulReportUrl = `${host}${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.SUCCESS}${tokenSuffix}`;
  const unsuccessfulReportUrl = `${host}${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.CANCELLED}${tokenSuffix}`;

  const pageConsentInfo = {
    pageTimeout: 1200,
    pageTimeoutUnit: 'SECONDS' as const,
    pageUserTimeout: 300,
    pageUserTimeoutUnit: 'SECONDS' as const,
    pageTimeOutReturnURL: `${host}${uri}?hubpisp_status=${HUBPISP_REDIRECT_STATUS.EXPIRED}${tokenSuffix}`,
  };

  const pispEmail = token
    ? $invoice?.partner?.emailAddress?.address
    : user?.email;

  try {
    const psuInfo = {
      name: [$invoice?.partner?.firstName, $invoice?.partner?.name]
        .filter(Boolean)
        .join(' '),
      email: pispEmail,
    };
    const currencyCode = $invoice?.currency?.code || DEFAULT_CURRENCY_CODE;
    const response = await createHubPispPaymentLink({
      amount: Number($amount),
      tenantId,
      email: pispEmail,
      context: {
        id: invoice.id,
        source: PAYMENT_SOURCE.INVOICES,
        amount: Number($amount),
        localInstrument: localInstrument ?? HUBPISP_LOCAL_INSTRUMENT.SCT,
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
      message: await t((error as any)?.message),
    };
  }
}
