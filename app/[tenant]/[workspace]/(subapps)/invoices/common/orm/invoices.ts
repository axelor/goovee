// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {clone, getPageInfo, getSkipInfo} from '@/utils';
import {formatNumber} from '@/locale/server/formatters';
import type {Partner} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
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
import {ExpandRecursively} from '@/types/util';

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
  workspaceURL: PortalWorkspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: partnerId} = where.partner || {};

  if (!(partnerId && workspaceURL)) return null;

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
    const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
    const scale = currency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;
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
  workspaceURL: PortalWorkspace['url'];
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
            // OR: [{expiresOn: null}, {expiresOn: {gt: new Date()}}], // TODO: add this back in when orm fixes date issue https://github.com/axelor/goovee-orm/issues/15
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
        ...(token && {
          portalTokenList: {where: {token}, select: {expiresOn: true}},
        }), // can be removed when orm fixes date issue
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
          orderBy: {paymentDate: 'ASC'},
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

  if (token && invoice.portalTokenList) {
    const access = invoice.portalTokenList[0];
    if (!access) return null;
    const {expiresOn} = access;
    if (expiresOn && new Date(expiresOn) < new Date()) {
      return null;
    }
  } // this block can be removed when orm fixes date issue

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
