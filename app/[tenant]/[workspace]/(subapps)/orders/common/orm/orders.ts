// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {clone, getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {and} from '@/utils/orm';
import {formatNumber} from '@/locale/server/formatters';
import type {Partner} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import type {ID} from '@/types';
import type {WhereOptions} from '@goovee/orm';
import type {AOSOrder} from '@/goovee/.generated/models/AOSOrder';
import type {AOSInvoice} from '@/goovee/.generated/models/AOSInvoice';
import type {AOSStockMove} from '@/goovee/.generated/models/AOSStockMove';

// ---- LOCAL IMPORTS ---- //
import {
  CUSTOMERS_DELIVERY_STATUS,
  INVOICE_STATUS,
  ORDER_STATUS,
} from '@/subapps/orders/common/constants/orders';
import type {
  CustomerDeliveryInput,
  InvoiceInput,
  SaleOrderLineInput,
} from '@/subapps/orders/common/types/orders';

export const findOrders = async ({
  isCompleted = false,
  params = {},
  client,
  workspaceURL,
}: {
  isCompleted?: boolean;
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
  workspaceURL: PortalWorkspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: clientPartnerId} = where.clientPartner || {};

  if (!(clientPartnerId && client && workspaceURL)) return null;

  const whereClause = and<AOSOrder>([
    where,
    {
      portalWorkspace: {url: workspaceURL},
      template: false,
    },
    {OR: [{archived: false}, {archived: null}]},
    isCompleted
      ? {
          statusSelect: {
            eq: ORDER_STATUS.CLOSED,
          },
        }
      : {
          statusSelect: ORDER_STATUS.CONFIRMED,
        },
  ]);

  const skip = limit ? getSkip(limit, page) : undefined;

  const $orders = await client.aOSOrder
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
        inTaxTotal: true,
        exTaxTotal: true,
        currency: {
          code: true,
          name: true,
          numberOfDecimals: true,
          symbol: true,
        },
      },
    })
    .catch(() => []);

  const orders = [];

  for (const order of $orders) {
    const {inTaxTotal, exTaxTotal, currency} = order;
    if (!currency) continue;
    const currencySymbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
    const unit = currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

    orders.push({
      ...order,
      currency,
      statusSelect: order.statusSelect!,
      deliveryState: order.deliveryState!,
      exTaxTotal: await formatNumber(String(exTaxTotal ?? 0), {
        scale: unit,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(String(inTaxTotal ?? 0), {
        scale: unit,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    });
  }

  const pageInfo = getPageInfo({
    count: $orders?.[0]?._count,
    page,
    limit,
  });

  return {
    orders,
    pageInfo,
  };
};

export async function findOrder({
  id,
  client,
  workspaceURL,
  params = {},
  invoicesParams = {},
}: {
  id: ID;
  client: Client;
  workspaceURL: PortalWorkspace['url'];
  params?: {where?: WhereOptions<AOSOrder>};
  invoicesParams?: {where?: WhereOptions<AOSInvoice>};
}) {
  if (!client && !workspaceURL) return null;

  const baseWhereClause = and<AOSOrder>([
    params.where,
    {
      id,
      portalWorkspace: {url: workspaceURL},
      template: false,
      OR: [{archived: false}, {archived: null}],
      statusSelect: {in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CLOSED]},
    },
  ]);

  const order = await client.aOSOrder.findOne({
    where: baseWhereClause,
    select: {
      saleOrderSeq: true,
      inTaxTotal: true,
      exTaxTotal: true,
      createdOn: true,
      statusSelect: true,
      deliveryState: true,
      shipmentMode: {name: true},
      clientPartner: {fullName: true},
      company: {name: true},
      mainInvoicingAddress: {
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {name: true},
      },
      deliveryAddress: {
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {name: true},
      },
      saleOrderLineList: {
        select: {
          id: true,
          productName: true,
          qty: true,
          unit: {name: true},
          priceDiscounted: true,
          exTaxTotal: true,
          discountAmount: true,
          inTaxTotal: true,
          product: {picture: {id: true}},
          taxLineSet: {select: {name: true, value: true}},
        },
      },
      currency: {code: true, numberOfDecimals: true, symbol: true},
      orderReport: {
        id: true,
      },
    },
  });

  if (!order) return null;

  const saleOrderLineIds = order?.saleOrderLineList?.map(line => line.id);
  const invoicesWhere = and<AOSInvoice>([
    invoicesParams?.where,
    {
      OR: [
        {saleOrder: {id: order.id}},
        {
          AND: [
            {saleOrder: {id: null}},
            {
              invoiceLineList: {
                saleOrderLine: {
                  id: {in: saleOrderLineIds},
                },
              },
            },
          ],
        },
      ],
    },
  ]);

  const [invoices, customerDeliveries] = await Promise.all([
    findInvoices({
      workspaceURL,
      client,
      whereClause: invoicesWhere,
    }),
    findCustomerDeliveries({
      workspaceURL,
      client,
      whereClause: {saleOrderSet: {id: order.id}},
    }),
  ]);

  const {
    currency,
    exTaxTotal = '0',
    inTaxTotal = '0',
    saleOrderLineList,
  } = order;

  const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;
  const $saleOrderLineList = (saleOrderLineList ?? []) as SaleOrderLineInput[];

  const totalDiscountAmount = $saleOrderLineList.reduce(
    (total: number, {exTaxTotal, discountAmount}) => {
      const exTax = parseFloat(String(exTaxTotal ?? 0));
      const discountPercent = parseFloat(String(discountAmount ?? 0));
      const discountValue = (exTax * discountPercent) / 100;
      return total + discountValue;
    },
    0,
  );

  const totalExTax = $saleOrderLineList.reduce(
    (total: number, {exTaxTotal}) => {
      return total + parseFloat(String(exTaxTotal ?? 0));
    },
    0,
  );

  const totalDiscountPercent =
    totalExTax === 0
      ? 0
      : ((totalDiscountAmount / totalExTax) * 100).toFixed(scale);

  const [$processedSaleOrderLineList, $invoices, $customerDeliveries] =
    await Promise.all([
      processSaleOrderLineList($saleOrderLineList, scale, currencySymbol),
      processInvoices(invoices as InvoiceInput[] | null),
      processCustomerDeliveries(
        customerDeliveries as CustomerDeliveryInput[] | null,
      ),
    ]);

  return {
    ...order,
    statusSelect: order.statusSelect!,
    deliveryState: order.deliveryState!,
    exTaxTotal: await formatNumber(String(exTaxTotal ?? 0), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    inTaxTotal: await formatNumber(String(inTaxTotal ?? 0), {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    saleOrderLineList: $processedSaleOrderLineList,
    invoices: $invoices,
    customerDeliveries: $customerDeliveries,
    totalDiscount: totalDiscountPercent,
  };
}

export async function findInvoices({
  workspaceURL,
  client,
  whereClause = null,
}: {
  workspaceURL: string;
  client: Client;
  whereClause?: WhereOptions<AOSInvoice> | null;
}) {
  if (!client && !workspaceURL) return null;

  const finalWhereClause = and<AOSInvoice>([
    whereClause,
    {
      portalWorkspace: {url: workspaceURL},
      statusSelect: {eq: INVOICE_STATUS.VENTILATED},
    },
    {OR: [{archived: false}, {archived: null}]},
  ]);

  const result = await client.aOSInvoice
    .find({
      where: finalWhereClause,
      select: {
        invoiceId: true,
        createdOn: true,
        invoiceLineList: {
          select: {saleOrderLine: {saleOrder: {id: true}}},
        },
      },
    })
    .then(clone)
    .catch(err => {
      console.error('Error fetching invoices:', err);
      return null;
    });

  return result;
}

export async function findCustomerDeliveries({
  workspaceURL,
  client,
  whereClause = null,
}: {
  ids?: ID[];
  workspaceURL: string;
  client: Client;
  whereClause?: WhereOptions<AOSStockMove> | null;
}) {
  if (!client && !workspaceURL) return null;

  const finalWhereClause = and<AOSStockMove>([
    whereClause,
    {
      statusSelect: CUSTOMERS_DELIVERY_STATUS.REALIZED,
      portalWorkspace: {url: workspaceURL},
    },
    {OR: [{archived: false}, {archived: null}]},
  ]);

  const result = await client.aOSStockMove
    .find({
      where: finalWhereClause,
      select: {
        id: true,
        stockMoveSeq: true,
        createdOn: true,
      },
    })
    .then(clone)
    .catch(error => {
      console.error('error >>>', error);
      return null;
    });
  return result;
}

async function processSaleOrderLineList(
  saleOrderLineList: SaleOrderLineInput[],
  scale: number,
  currencySymbol: string,
) {
  return Promise.all(
    saleOrderLineList.map(async line => ({
      ...line,
      productName: line.productName ?? '',
      qty: await formatNumber(line.qty?.toString(), {
        scale,
        type: 'DECIMAL',
      }),
      priceDiscounted: await formatNumber(line.priceDiscounted?.toString(), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      exTaxTotal: await formatNumber(line.exTaxTotal?.toString(), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      discountAmount: await formatNumber(line.discountAmount?.toString(), {
        scale,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(line.inTaxTotal?.toString(), {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      taxLineSet: await Promise.all(
        (line.taxLineSet ?? []).map(async taxLine => ({
          name: taxLine.name,
          value: await formatNumber(String(taxLine.value ?? 0), {
            scale,
            type: 'DECIMAL',
          }),
        })),
      ),
    })),
  );
}

async function processInvoices(invoices: InvoiceInput[] | null) {
  return (invoices ?? []).map(({id, invoiceId, createdOn}) => ({
    id,
    invoiceId,
    createdOn,
  }));
}

async function processCustomerDeliveries(
  customerDeliveries: CustomerDeliveryInput[] | null,
) {
  return (customerDeliveries ?? []).map(({id, stockMoveSeq, createdOn}) => ({
    id,
    stockMoveSeq,
    createdOn,
  }));
}
