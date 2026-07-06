// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {clone, getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {formatNumber} from '@/locale/server/formatters';
import type {Partner} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {buildPendingStripeBankTransferIntents} from '@/lib/core/payment/stripe/service';
import {findPendingHubPispPayments} from '@/lib/core/payment/hubpisp/orm';
import {findPendingStripeBankTransfers} from '@/lib/core/payment/stripe/orm';

// ---- LOCAL IMPORTS ---- //
import type {
  Invoice,
  PaymentListItem,
} from '@/subapps/invoices/common/types/invoices';
import {INVOICE} from '@/subapps/invoices/common/constants/invoices';
import {buildWhereClause} from '@/subapps/invoices/common/utils/invoices';

export const findInvoices = async ({
  params = {},
  type,
  client,
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
  client: Client;
  workspaceURL: Workspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: partnerId} = where.partner || {};

  if (!(partnerId && workspaceURL)) return null;

  const whereClause = buildWhereClause({params, workspaceURL, type});

  const skip = limit ? getSkip(limit, page) : undefined;

  const $invoices = await client.aOSInvoice.find({
    where: whereClause,
    take: limit ? Number(limit) : undefined,
    ...(skip ? {skip} : {}),
    orderBy: {createdOn: ORDER_BY.DESC},
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
  });

  const invoices = [];

  for (const invoice of $invoices) {
    const {currency, exTaxTotal, inTaxTotal, amountRemaining} = invoice;
    const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
    const scale = currency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;
    const isUnpaid = Number(amountRemaining) !== 0;

    invoices.push({
      ...invoice,
      isUnpaid,
      exTaxTotal: await formatNumber(String(exTaxTotal), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(String(inTaxTotal), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    });
  }

  const pageInfo = getPageInfo({
    count: $invoices?.[0]?._count,
    page,
    limit,
  });
  return {invoices, pageInfo};
};
type InvoiceType = (typeof INVOICE)[keyof typeof INVOICE];

export const findInvoice = async ({
  id,
  token,
  type,
  params,
  client,
  workspaceURL,
}: {
  id: Invoice['id'];
  token?: string;
  type?: InvoiceType;
  params?: {
    where?: object & {
      partner?: {
        id: Partner['id'];
      };
    };
  };
  client: Client;
  workspaceURL: Workspace['url'];
}): Promise<Invoice | null> => {
  if (!workspaceURL) return null;

  const whereClause = buildWhereClause({params, workspaceURL, type});
  const invoice = await client.aOSInvoice
    .findOne({
      where: {
        ...(id && {id}),
        ...(token && {
          portalTokenList: {
            token,
            OR: [{expiresOn: null}, {expiresOn: {gt: new Date()}}],
          },
        }),
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
              alpha2Code: true,
            },
          },
          partner: {
            fixedPhone: true,
          },
        },
        partner: {
          firstName: true,
          simpleFullName: true,
          fixedPhone: true,
          emailAddress: {
            address: true,
          },
          mainAddress: {
            zip: true,
            addressl2: true,
            addressl4: true,
            addressl6: true,
            country: {
              name: true,
            },
          },
          name: true,
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
          orderBy: {paymentDate: ORDER_BY.ASC},
          select: {
            paymentDate: true,
            amount: true,
          },
        },
        address: {
          zip: true,
          addressl2: true,
          addressl4: true,
          addressl6: true,
          country: {
            name: true,
            alpha2Code: true,
            numericCode: true,
          },
          city: {
            name: true,
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

  const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;
  const currencyCode = currency?.code || DEFAULT_CURRENCY_CODE;

  const $invoicePaymentList: PaymentListItem[] = [];
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

  const pendingStripeBankTransferPayments =
    await findPendingStripeBankTransfers({client, id: invoice.id});

  const resolved = await Promise.all(
    pendingStripeBankTransferPayments?.map(async ctx => ({
      ...ctx,
      data: await ctx.data,
    })) || [],
  );

  const pendingStripeBankTransferIntents =
    await buildPendingStripeBankTransferIntents({
      resolvedContexts: resolved,
      currencyCode,
      currencySymbol,
      scale,
    });

  const pendingHubPispContexts = await findPendingHubPispPayments({
    client,
    entityId: invoice.id,
    currencySymbol,
    scale,
  });

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
    pendingStripeBankTransferIntents,
    pendingHubPispContexts,
  };
};
