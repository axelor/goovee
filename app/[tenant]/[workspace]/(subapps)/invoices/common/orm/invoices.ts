// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {clone, getPageInfo, getSkipInfo} from '@/utils';
import {formatNumber} from '@/locale/server/formatters';
import type {Partner, PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import type {Invoice} from '@/subapps/invoices/common/types/invoices';
import {INVOICE} from '@/subapps/invoices/common/constants/invoices';
import {buildWhereClause} from '@/subapps/invoices/common/utils/invoices';

export const findInvoices = async ({
  params = {},
  type,
  tenantId,
  workspaceURL,
}: {
  params?: {
    where?: object & {
      partner?: {
        id: Partner['id'];
      };
    };
    limit?: string | number;
    page?: string | number;
  };
  type?: string;
  tenantId: Tenant['id'];
  workspaceURL: PortalWorkspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: partnerId} = where.partner || {};

  if (!(partnerId && tenantId && workspaceURL)) return null;

  const client = await manager.getClient(tenantId);

  const whereClause = buildWhereClause({params, workspaceURL, type});

  const skip = getSkipInfo(limit, page);

  const $invoices = await client.aOSInvoice
    .find({
      where: whereClause,
      take: limit as any,
      ...(skip ? {skip: skip as any} : {}),
      orderBy: {createdOn: ORDER_BY.DESC} as any,
      select: {
        invoiceId: true,
        dueDate: true,
        invoiceDate: true,
        exTaxTotal: true,
        inTaxTotal: true,
        amountRemaining: true,
        currency: {
          code: true,
          numberOfDecimals: true,
          symbol: true,
        },
      },
    })
    .then(clone);

  const invoices: any = [];

  for (const invoice of $invoices) {
    const {currency, exTaxTotal, inTaxTotal, amountRemaining} = invoice;
    const currencySymbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
    const scale = currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;
    const isUnpaid = Number(amountRemaining) !== 0;
    const $invoice = {
      ...invoice,
      isUnpaid,
      exTaxTotal: await formatNumber(exTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(inTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    };

    invoices.push($invoice);
  }

  const pageInfo = getPageInfo({
    count: invoices?.[0]?._count,
    page,
    limit,
  });
  return {invoices, pageInfo};
};
type InvoiceType = (typeof INVOICE)[keyof typeof INVOICE];

export const findInvoice = async ({
  id,
  type = INVOICE.UNPAID,
  params,
  tenantId,
  workspaceURL,
}: {
  id: Invoice['id'];
  type?: InvoiceType;
  params?: {
    where?: object & {
      partner?: {
        id: Partner['id'];
      };
    };
  };
  tenantId: Tenant['id'];
  workspaceURL: PortalWorkspace['url'];
}) => {
  if (!(tenantId && workspaceURL)) return null;

  const client = await manager.getClient(tenantId);

  const whereClause = buildWhereClause({params, workspaceURL, type});
  const invoice: any = await client.aOSInvoice
    .findOne({
      where: {
        id,
        ...params?.where,
        ...whereClause,
      },
      select: {
        invoiceId: true,
        invoiceDate: true,
        dueDate: true,
        exTaxTotal: true,
        inTaxTotal: true,
        amountRemaining: true,
        note: true,
        taxTotal: true,
        company: {
          name: true,
          address: {
            zip: true,
            addressl2: true,
            addressl4: true,
            addressl6: true,
            country: {
              name: true,
            },
          },
          partner: {
            fixedPhone: true,
          },
        },
        partner: {
          simpleFullName: true,
          fixedPhone: true,
          mainAddress: {
            zip: true,
            addressl2: true,
            addressl4: true,
            addressl6: true,
            country: {
              name: true,
            },
          },
        },
        paymentCondition: {
          name: true,
        },
        currency: {
          code: true,
          numberOfDecimals: true,
          symbol: true,
        },
        invoicePaymentList: {
          orderBy: {paymentDate: 'ASC'},
          select: {
            paymentDate: true,
            amount: true,
          },
        },
      },
    })
    .then(clone);

  if (!invoice) {
    return null;
  }

  const {
    currency,
    exTaxTotal,
    inTaxTotal,
    amountRemaining,
    taxTotal,
    invoicePaymentList,
  } = invoice;
  const currencySymbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const $invoicePaymentList: any = [];
  for (const list of invoicePaymentList || []) {
    const line = {
      ...list,
      amount: await formatNumber(list.amount, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    };
    $invoicePaymentList.push(line);
  }

  return {
    ...invoice,
    exTaxTotal: await formatNumber(exTaxTotal, {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    inTaxTotal: await formatNumber(inTaxTotal, {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    amountRemaining: {
      value: amountRemaining,
      symbol: currencySymbol,
      formattedValue: await formatNumber(amountRemaining, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    },
    taxTotal: await formatNumber(taxTotal, {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    invoicePaymentList: $invoicePaymentList,
    isUnpaid: Number(invoice.amountRemaining) !== 0,
  };
};
