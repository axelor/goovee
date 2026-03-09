//---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, PortalWorkspace, User} from '@/types';
import type {ActionResponse} from '@/types/action';
import type {Tenant} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {extractAmount} from '@/subapps/invoices/common/utils/invoices';

export async function validatePaymentData({
  workspaceURL,
  invoice,
  amount,
  tenantId,
}: {
  workspaceURL: string;
  invoice: {
    id: string | number;
  };
  amount: string;
  tenantId: Tenant['id'];
}): Promise<
  ActionResponse<{
    workspace: PortalWorkspace;
    user: User;
    $amount: string | number;
    $invoice?: any;
    isPartialPayment: boolean;
  }>
> {
  if (!workspaceURL) {
    return {error: true, message: await t('Workspace not provided')};
  }

  if (!invoice?.id) {
    return {error: true, message: await t('Invoice is missing')};
  }

  if (!amount) {
    return {error: true, message: await t('Amount is missing')};
  }

  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.invoices,
    user,
    url: workspace.url,
    tenantId,
  });
  if (!subapp) {
    return {error: true, message: await t('Unauthorized app access')};
  }

  const {role, isContactAdmin} = subapp;
  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const $invoice = await findInvoice({
    type: INVOICE.UNPAID,
    id: invoice.id,
    params: {where: invoicesWhereClause},
    workspaceURL,
    tenantId,
  });
  if (!$invoice) {
    return {error: true, message: await t('Invalid invoice')};
  }

  if (workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.NO) {
    return {error: true, message: await t('Payment not allowed')};
  }

  const $amount = extractAmount(amount);
  const remainingAmount = extractAmount($invoice?.amountRemaining?.value);

  const isPartialPayment =
    workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL;
  const isTotalPayment =
    workspace?.config?.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL;

  if (isTotalPayment && $amount !== remainingAmount) {
    return {
      error: true,
      message: await t('Payment must match the total amount'),
    };
  } else if (isPartialPayment && $amount > remainingAmount) {
    return {
      error: true,
      message: await t('Payment exceeds the remaining amount.'),
    };
  }

  if (!workspace?.config?.allowOnlinePaymentForInvoices) {
    return {error: true, message: await t('Online payment is not available')};
  }

  const paymentOptions = workspace?.config?.paymentOptionSet;
  if (!paymentOptions?.length) {
    return {
      error: true,
      message: await t('Payment options are not configured'),
    };
  }

  return {
    success: true,
    data: {
      workspace,
      user,
      $amount,
      $invoice,
      isPartialPayment: $amount < remainingAmount,
    },
  };
}
