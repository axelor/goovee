// ---- CORE IMPORTS ---- //
import type {Partner} from '@/types';
import {convertDateToISO8601} from '@/utils/date';

// ---- LOCAL IMPORTS ---- //
import {
  INVOICE,
  INVOICE_CATEGORY,
  INVOICE_STATUS,
} from '@/subapps/invoices/common/constants/invoices';

/* The boundary has to be read per call, or a process that stays up past
 * midnight keeps answering for the day it started on. A due date carries no
 * time, so it is compared as a date — turning it into an instant reads as the
 * previous day for anyone west of UTC. */
export function isInvoiceOverdue(invoice: {
  isUnpaid: boolean;
  dueDate: string | null;
}): boolean {
  if (!invoice.isUnpaid || !invoice.dueDate) return false;

  const today = convertDateToISO8601(new Date());
  return !!today && invoice.dueDate < today;
}

export function extractAmount(
  amount: string | number | null | undefined,
): number {
  if (amount === null || amount === undefined) return 0;
  const amountStr = String(amount);
  const numericValue = parseFloat(amountStr.replace(/[^0-9.-]+/g, ''));

  return isNaN(numericValue) ? 0 : numericValue;
}

export function buildWhereClause({
  params,
  workspaceURL,
  type,
}: {
  params?: {where?: object & {partner?: {id: Partner['id']}}};
  workspaceURL: string;
  type?: string;
}) {
  const workspaceConditions = {
    OR: [
      {portalWorkspace: {url: workspaceURL}},
      {saleOrder: {portalWorkspace: {url: workspaceURL}}},
    ],
  };

  return {
    ...params?.where,
    statusSelect: {eq: INVOICE_STATUS.VENTILATED},
    operationTypeSelect: INVOICE_CATEGORY.SALE_INVOICE,
    // ARCHIVED FILTER
    OR: [{archived: false}, {archived: null}],
    AND: [
      workspaceConditions,
      type
        ? type === INVOICE.PAID
          ? {amountRemaining: {eq: 0}}
          : {amountRemaining: {ne: 0}}
        : false,
    ].filter(Boolean),
  };
}
