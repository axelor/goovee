//---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import type {Cloned} from '@/types/util';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, User} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import type {ActionResponse} from '@/types/action';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import type {InvoicePaymentInput} from '@/subapps/invoices/common/validators';
import type {Invoice} from '@/subapps/invoices/common/types/invoices';
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
  client,
  token,
  tenantId,
}: InvoicePaymentInput & {client: Client; tenantId: string}): Promise<
  ActionResponse<{
    workspace: PortalWorkspace | Cloned<PortalWorkspace>;
    user: User | undefined;
    $amount: string | number;
    $invoice: Invoice;
    isPartialPayment: boolean;
  }>
> {
  let user: User | undefined;
  if (!token) {
    const session = await getSession();
    user = session?.user;
    if (!user) {
      return {error: true, message: await t('Unauthorized')};
    }
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    client,
    user,
  });
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  let invoicesWhereClause = {};
  if (!token) {
    const subapp = await findSubappAccess({
      code: SUBAPP_CODES.invoices,
      user: user!,
      url: workspace.url,
      client,
    });
    if (!subapp) {
      return {error: true, message: await t('Unauthorized app access')};
    }

    const {role, isContactAdmin} = subapp;
    invoicesWhereClause = getWhereClauseForEntity({
      user: user!,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
  }

  const $invoice = await findInvoice({
    id: invoice.id,
    type: INVOICE.UNPAID,
    ...(token ? {token} : {params: {where: invoicesWhereClause}}),
    workspaceURL,
    tenantId,
    client,
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
