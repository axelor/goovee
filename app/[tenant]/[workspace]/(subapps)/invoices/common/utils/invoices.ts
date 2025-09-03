// ---- LOCAL IMPORTS ---- //

import {
  INVOICE,
  INVOICE_CATEGORY,
  INVOICE_STATUS,
} from '@/subapps/invoices/common/constants/invoices';

export function extractAmount(amount: string | number): number {
  const amountStr = String(amount);
  const numericValue = parseFloat(amountStr.replace(/[^0-9.-]+/g, ''));

  return isNaN(numericValue) ? 0 : numericValue;
}

export function buildWhereClause({
  params,
  workspaceURL,
  type,
}: {
  params: any;
  workspaceURL: string;
  type?: string;
}) {
  const workspaceConditions: any = {
    OR: [
      {portalWorkspace: {url: workspaceURL}},
      {saleOrder: {portalWorkspace: {url: workspaceURL}}},
    ],
  };

  const isPaid = type === INVOICE.PAID;

  let whereClause: any = {
    ...params?.where,
    statusSelect: {eq: INVOICE_STATUS.VENTILATED},
    operationTypeSelect: INVOICE_CATEGORY.SALE_INVOICE,
    // ARCHIVED FILTER
    OR: [{archived: false}, {archived: null}],
  };

  whereClause.AND = [
    ...(whereClause.AND || []),
    workspaceConditions,
    isPaid ? {amountRemaining: {eq: 0}} : {amountRemaining: {ne: 0}},
  ];

  return whereClause;
}
