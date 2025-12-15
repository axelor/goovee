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
import {ID} from '@goovee/orm';
import {and} from '@/utils/orm';

// ---- LOCAL IMPORTS ---- //
import {
  CUSTOMERS_DELIVERY_STATUS,
  INVOICE_STATUS,
  ORDER_STATUS,
} from '@/subapps/orders/common/constants/orders';
import type {Order} from '@/subapps/orders/common/types/orders';

export const findOrders = async ({
  isCompleted = false,
  params = {},
  tenantId,
  workspaceURL,
}: {
  isCompleted?: boolean;
  params?: {
    where?: object & {
      clientPartner?: {
        id: Partner['id'];
      };
    };
    limit?: string | number;
    page?: string | number;
  };
  tenantId: Tenant['id'];
  workspaceURL: PortalWorkspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: clientPartnerId} = where.clientPartner || {};

  if (!(clientPartnerId && tenantId && workspaceURL)) return null;

  const client = await manager.getClient(tenantId);

  const whereClause = and<any>([
    where,
    {
      portalWorkspace: {
        url: workspaceURL,
      },
      template: false,
      OR: [{archived: false}, {archived: null}],
    },
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

  const skip = getSkipInfo(limit, page);

  const $orders = await client.aOSOrder
    .find({
      where: whereClause,
      take: limit as any,
      ...(skip ? {skip: skip as any} : {}),
      orderBy: {createdOn: ORDER_BY.DESC} as any,
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
    .catch((err: any) => {
      return [];
    });

  const orders: any = [];

  for (const order of $orders) {
    const {inTaxTotal, exTaxTotal, currency} = order;
    const currencySymbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
    const unit = currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

    const $order = {
      ...order,
      exTaxTotal: await formatNumber(exTaxTotal, {
        scale: unit,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(inTaxTotal, {
        scale: unit,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    };

    orders.push($order);
  }

  const pageInfo = getPageInfo({
    count: orders?.[0]?._count,
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
  tenantId,
  workspaceURL,
  params = {},
  isCompleted = false,
  invoicesParams = {},
}: {
  id: Order['id'];
  tenantId: Tenant['id'];
  workspaceURL: PortalWorkspace['url'];
  params?: any;
  isCompleted?: boolean;
  invoicesParams?: any;
}) {
  if (!tenantId && !workspaceURL) return null;

  const client = await manager.getClient(tenantId);
  if (!client) {
    return null;
  }

  const baseWhereClause = and([
    params.where,
    {
      id,
      portalWorkspace: {url: workspaceURL},
      template: false,
      OR: [{archived: false}, {archived: null}],
    },
    isCompleted
      ? {statusSelect: {eq: ORDER_STATUS.CLOSED}}
      : {
          statusSelect: ORDER_STATUS.CONFIRMED,
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

  const saleOrderLineIds = order?.saleOrderLineList?.map(
    (line: any) => line.id,
  );
  const invoicesWhere = and([
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
      tenantId,
      whereClause: invoicesWhere,
    }),
    findCustomerDeliveries({
      workspaceURL,
      tenantId,
      whereClause: {
        saleOrderSet: {id: order.id},
      },
    }),
  ]);

  const {
    currency,
    exTaxTotal = '0',
    inTaxTotal = '0',
    saleOrderLineList = [],
  } = order;

  const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;

  const totalDiscountAmount = saleOrderLineList.reduce(
    (total: number, {exTaxTotal, discountAmount}: any) => {
      const exTax = parseFloat(exTaxTotal);
      const discountPercent = parseFloat(discountAmount);
      const discountValue = (exTax * discountPercent) / 100;
      return total + discountValue;
    },
    0,
  );

  const totalExTax = saleOrderLineList.reduce(
    (total: number, {exTaxTotal}: any) => {
      return total + parseFloat(exTaxTotal);
    },
    0,
  );

  const totalDiscountPercent =
    totalExTax === 0
      ? 0
      : ((totalDiscountAmount / totalExTax) * 100).toFixed(scale);

  const [$saleOrderLineList, $invoices, $customerDeliveries] =
    await Promise.all([
      processSaleOrderLineList(saleOrderLineList, scale, currencySymbol),
      processInvoices(invoices),
      processCustomerDeliveries(customerDeliveries),
    ]);

  return {
    ...order,
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
    saleOrderLineList: $saleOrderLineList,
    invoices: $invoices,
    customerDeliveries: $customerDeliveries,
    totalDiscount: totalDiscountPercent,
  };
}

export async function findInvoices({
  workspaceURL,
  tenantId,
  whereClause = null,
}: {
  workspaceURL: string;
  tenantId: Tenant['id'];
  whereClause?: any;
}) {
  if (!tenantId && !workspaceURL) return null;

  const client = await manager.getClient(tenantId);
  if (!client) {
    return null;
  }

  const finalWhereClause = {
    ...whereClause,
    portalWorkspace: {url: workspaceURL},
    statusSelect: {eq: INVOICE_STATUS.VENTILATED},
    OR: [{archived: false}, {archived: null}],
  };

  const result: any = await client.aOSInvoice
    .find({
      where: finalWhereClause,
      select: {
        invoiceId: true,
        createdOn: true,
        saleOrder: {id: true},
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
  tenantId,
  whereClause = null,
}: {
  ids?: ID[];
  workspaceURL: string;
  tenantId: Tenant['id'];
  whereClause?: any;
}) {
  if (!tenantId && !workspaceURL) return null;

  const client = await manager.getClient(tenantId);
  if (!client) {
    return null;
  }

  const result: any = await client.aOSStockMove
    .find({
      where: {
        ...whereClause,
        statusSelect: CUSTOMERS_DELIVERY_STATUS.REALIZED,
        portalWorkspace: {url: workspaceURL},
        OR: [{archived: false}, {archived: null}],
      },
      select: {
        id: true,
        stockMoveSeq: true,
        createdOn: true,
      },
    })
    .then(clone)
    .catch(error => {
      console.log('error >>>', error);
      return null;
    });
  return result;
}

async function processSaleOrderLineList(
  saleOrderLineList: any[],
  scale: number,
  currencySymbol: string,
) {
  return Promise.all(
    saleOrderLineList.map(async line => ({
      ...line,
      qty: await formatNumber(line.qty, {scale, type: 'DECIMAL'}),
      priceDiscounted: await formatNumber(line.priceDiscounted, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      exTaxTotal: await formatNumber(line.exTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      discountAmount: await formatNumber(line.discountAmount, {
        scale,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(line.inTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      taxLineSet: await Promise.all(
        line.taxLineSet.map(async (taxLine: any) => ({
          ...taxLine,
          value: await formatNumber(taxLine.value, {
            scale,
            type: 'DECIMAL',
          }),
        })),
      ),
    })),
  );
}

async function processInvoices(invoices: any[]) {
  return Promise.all(
    (invoices ?? []).map(async ({invoiceId, ...rest}) => ({
      ...rest,
      invoiceId,
    })),
  );
}

async function processCustomerDeliveries(customerDeliveries: any[]) {
  return Promise.all(
    (customerDeliveries ?? []).map(async ({stockMoveSeq, ...rest}) => ({
      ...rest,
      stockMoveSeq,
    })),
  );
}
