// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {getSkip} from '@/utils/pagination';
import {getPageInfo} from '@/utils';
import type {ID, Partner} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {formatNumber} from '@/locale/server/formatters';
import {and} from '@/utils/orm';
import type {WhereOptions} from '@goovee/orm';
import type {AOSOrder} from '@/goovee/.generated/models/AOSOrder';

// ---- LOCAL IMPORTS ---- //
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';

export const fetchQuotations = async ({
  params = {},
  client,
  workspaceURL,
}: {
  archived?: boolean;
  params?: {
    where?: WhereOptions<AOSOrder> & {
      clientPartner?: {
        id: Partner['id'];
      };
    };
    limit?: string | number;
    page?: string | number;
  };
  client: Client;
  workspaceURL: Workspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: clientPartnerId} = where.clientPartner || {};

  if (!(clientPartnerId && client && workspaceURL))
    return {quotations: [], pageInfo: getPageInfo({})};
  const skip = limit ? getSkip(limit, page) : undefined;

  const whereClause = and<AOSOrder>([
    where,
    {
      template: false,
      portalWorkspace: {
        url: workspaceURL,
      },
    },
    {OR: [{archived: false}, {archived: null}]},
    {
      OR: [
        {statusSelect: {lt: QUOTATION_STATUS.CONFIRMED}},
        {statusSelect: {eq: QUOTATION_STATUS.CANCELED_QUOTATION}},
      ],
    },
  ]);

  const $quotations = await client.aOSOrder
    .find({
      where: whereClause,
      take: limit ? Number(limit) : undefined,
      ...(skip ? {skip} : {}),
      orderBy: {createdOn: ORDER_BY.DESC},
      select: {
        saleOrderSeq: true,
        statusSelect: true,
        deliveryState: true,
        createdOn: true,
        externalReference: true,
        endOfValidityDate: true,
        inTaxTotal: true,
        currency: {
          numberOfDecimals: true,
          symbol: true,
        },
      },
    })
    .catch(() => []);

  /* Written here rather than in the page so a quotation's total reads the same
   * in the list as it does on its detail, down to the scale and the symbol. */
  const quotations = await Promise.all(
    $quotations.map(async quotation => {
      const {currency, inTaxTotal} = quotation;

      return {
        ...quotation,
        displayInTaxTotal: await formatNumber(String(inTaxTotal ?? 0), {
          scale: currency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
          currency: currency?.symbol || DEFAULT_CURRENCY_SYMBOL,
          type: 'DECIMAL',
        }),
      };
    }),
  );

  const pageInfo = getPageInfo({
    count: $quotations?.[0]?._count,
    page,
    limit,
  });

  return {
    quotations,
    pageInfo,
  };
};

export async function findQuotation({
  id,
  client,
  params,
  workspaceURL,
}: {
  id: ID;
  client: Client;
  params?: {where?: WhereOptions<AOSOrder>};
  workspaceURL: Workspace['url'];
}) {
  if (!(client && workspaceURL)) return null;

  const whereClause = and<AOSOrder>([
    params?.where,
    {
      id,
      template: false,
      portalWorkspace: {
        url: workspaceURL,
      },
    },
    {OR: [{archived: false}, {archived: null}]},
    {
      OR: [
        {statusSelect: {lt: QUOTATION_STATUS.CONFIRMED}},
        {statusSelect: {eq: QUOTATION_STATUS.CANCELED_QUOTATION}},
      ],
    },
  ]);

  const quotation = await client.aOSOrder.findOne({
    where: whereClause,
    select: {
      saleOrderSeq: true,
      externalReference: true,
      createdOn: true,
      endOfValidityDate: true,
      exTaxTotal: true,
      statusSelect: true,
      inTaxTotal: true,
      mainInvoicingAddress: {
        formattedFullName: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      clientPartner: {
        fullName: true,
      },
      company: {
        name: true,
      },
      deliveryAddress: {
        formattedFullName: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      saleOrderLineList: {
        select: {
          id: true,
          productName: true,
          qty: true,
          unit: {
            name: true,
          },
          priceDiscounted: true,
          exTaxTotal: true,
          taxLineSet: {
            select: {name: true, value: true},
          },
          discountAmount: true,
          inTaxTotal: true,
          product: {
            picture: {
              id: true,
            },
          },
        },
      },
      currency: {
        code: true,
        numberOfDecimals: true,
        symbol: true,
      },
    },
  });

  if (!quotation) {
    return null;
  }

  const {currency, saleOrderLineList, exTaxTotal, inTaxTotal} = quotation;

  /* An order can be stored without a currency, and every amount column is
   * nullable, so each one is read through a default — otherwise the page either
   * throws on the missing currency or prints "null" where a total belongs.
   * The scale takes ?? so a currency with no decimals keeps none. */
  const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;

  const totalDiscountAmount = (saleOrderLineList ?? []).reduce(
    (total, {exTaxTotal, discountAmount}) => {
      const exTax = parseFloat(String(exTaxTotal ?? 0));
      const discountPercent = parseFloat(String(discountAmount ?? 0));
      const discountValue = (exTax * discountPercent) / 100;
      return total + discountValue;
    },
    0,
  );

  const totalExTax = (saleOrderLineList ?? []).reduce((total, {exTaxTotal}) => {
    return total + parseFloat(String(exTaxTotal ?? 0));
  }, 0);

  const totalDiscountPercent =
    totalExTax === 0
      ? 0
      : ((totalDiscountAmount / totalExTax) * 100).toFixed(scale);

  const $saleOrderLineList = [];

  for (const list of saleOrderLineList || []) {
    const line = {
      ...list,
      qty: await formatNumber(String(list.qty ?? 0), {scale, type: 'DECIMAL'}),
      /* Left null rather than defaulted: a zero total is a coherent statement,
       * but a zero unit price next to a real line total is not. */
      priceDiscounted: await formatNumber(
        list.priceDiscounted == null ? null : String(list.priceDiscounted),
        {scale, currency: currencySymbol, type: 'DECIMAL'},
      ),
      exTaxTotal: await formatNumber(String(list.exTaxTotal ?? 0), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      discountAmount: await formatNumber(String(list.discountAmount ?? 0), {
        scale,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(String(list.inTaxTotal ?? 0), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      taxLineSet: await Promise.all(
        (list.taxLineSet ?? []).map(async taxLine => ({
          ...taxLine,
          value: await formatNumber(String(taxLine.value ?? 0), {
            scale,
            type: 'DECIMAL',
          }),
        })),
      ),
    };
    $saleOrderLineList.push(line);
  }

  return {
    ...quotation,
    displayExTaxTotal: await formatNumber(String(exTaxTotal ?? 0), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    displayInTaxTotal: await formatNumber(String(inTaxTotal ?? 0), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    saleOrderLineList: $saleOrderLineList,
    totalDiscount: totalDiscountPercent,
  };
}
