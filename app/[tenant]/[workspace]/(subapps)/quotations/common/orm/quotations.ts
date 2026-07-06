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

  const quotations = await client.aOSOrder
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
      },
    })
    .catch(() => []);

  const pageInfo = getPageInfo({
    count: quotations?.[0]?._count,
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
      endOfValidityDate: true,
      exTaxTotal: true,
      statusSelect: true,
      inTaxTotal: true,
      mainInvoicingAddress: {
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {
          name: true,
        },
        fullName: true,
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
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {
          name: true,
        },
        fullName: true,
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

  const currencySymbol = currency!.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = Number(currency!.numberOfDecimals) || DEFAULT_CURRENCY_SCALE;

  const totalDiscountAmount = (saleOrderLineList ?? []).reduce(
    (total, {exTaxTotal, discountAmount}) => {
      const exTax = parseFloat(String(exTaxTotal));
      const discountPercent = parseFloat(String(discountAmount));
      const discountValue = (exTax * discountPercent) / 100;
      return total + discountValue;
    },
    0,
  );

  const totalExTax = (saleOrderLineList ?? []).reduce((total, {exTaxTotal}) => {
    return total + parseFloat(String(exTaxTotal));
  }, 0);

  const totalDiscountPercent =
    totalExTax === 0
      ? 0
      : ((totalDiscountAmount / totalExTax) * 100).toFixed(scale);

  const $saleOrderLineList = [];

  for (const list of saleOrderLineList || []) {
    const line = {
      ...list,
      qty: await formatNumber(String(list.qty), {scale, type: 'DECIMAL'}),
      priceDiscounted: await formatNumber(String(list.priceDiscounted), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      exTaxTotal: await formatNumber(String(list.exTaxTotal), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      discountAmount: await formatNumber(String(list.discountAmount), {
        scale,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(String(list.inTaxTotal), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      taxLineSet: await Promise.all(
        (list.taxLineSet ?? []).map(async taxLine => ({
          ...taxLine,
          value: await formatNumber(String(taxLine.value), {
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
    displayExTaxTotal: await formatNumber(String(exTaxTotal), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    displayInTaxTotal: await formatNumber(String(inTaxTotal), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    saleOrderLineList: $saleOrderLineList,
    totalDiscount: totalDiscountPercent,
  };
}
