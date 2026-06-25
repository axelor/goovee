//---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import type {Cloned} from '@/types/util';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {ensureTokenAuth} from '@/lib/core/access/ensure-token-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {getWorkspaceConfig} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, User} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import type {Tenant} from '@/tenant';
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

/* The fusion that scopes an invoice query: a token restricts the lookup to the
   invoice that owns the token, a session restricts it to the partner's own
   invoices. Each action spreads this into its findInvoice WHERE. */
export type InvoiceFilter = {token: string} | {params: {where: object}};

/**
 * Resolves access for an invoice payment request. The token path goes through
 * ensureTokenAuth (no user, no sub-app — authorization is the token fused into
 * the invoice query); the session path goes through ensureAuth and scopes the
 * query to the partner's invoices. Returns the tenant so callers keep using
 * tenant.client / tenant.config exactly as before.
 */
export async function resolveInvoicePaymentAccess({
  workspaceURL,
  tenantId,
  token,
}: {
  workspaceURL: string;
  tenantId: string;
  token?: string;
}): Promise<
  ActionResponse<{
    tenant: Tenant;
    workspace: PortalWorkspace;
    user: User | undefined;
    invoiceFilter: InvoiceFilter;
  }>
> {
  if (token) {
    const access = await ensureTokenAuth({url: workspaceURL, tenantId, token});
    if (!access.ok) {
      return {error: true, message: await accessMessage(access.reason)};
    }
    const config = await getWorkspaceConfig(
      access.workspace.config.id,
      access.client,
    );
    if (!config) {
      return {error: true, message: await t('Invalid workspace')};
    }
    return {
      success: true,
      data: {
        tenant: access.tenant,
        workspace: {...access.workspace, config},
        user: undefined,
        invoiceFilter: {token},
      },
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.invoices,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const config = await getWorkspaceConfig(
    access.workspace.config.id,
    access.client,
  );
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }
  const invoicesWhereClause = getWhereClauseForEntity({
    user: access.user,
    role: access.subapp.role,
    isContactAdmin: access.subapp.isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });
  return {
    success: true,
    data: {
      tenant: access.tenant,
      workspace: {...access.workspace, config},
      user: access.user,
      invoiceFilter: {params: {where: invoicesWhereClause}},
    },
  };
}

/**
 * Validates the unpaid invoice and the requested amount against the workspace's
 * payment configuration. Access must already be resolved by the caller via
 * resolveInvoicePaymentAccess, which provides the workspace and the invoice
 * filter — this only enforces payment policy.
 */
export async function validatePaymentData({
  workspace,
  client,
  invoice,
  amount,
  invoiceFilter,
  workspaceURL,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  invoice: InvoicePaymentInput['invoice'];
  amount: string;
  invoiceFilter: InvoiceFilter;
  workspaceURL: string;
}): Promise<
  ActionResponse<{
    $amount: string | number;
    $invoice: Invoice;
    isPartialPayment: boolean;
  }>
> {
  const $invoice = await findInvoice({
    id: invoice.id,
    type: INVOICE.UNPAID,
    ...invoiceFilter,
    workspaceURL,
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
      $amount,
      $invoice,
      isPartialPayment: $amount < remainingAmount,
    },
  };
}
