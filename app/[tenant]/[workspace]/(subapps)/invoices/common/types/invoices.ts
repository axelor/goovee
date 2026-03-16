// ---- CORE IMPORTS ---- //
import {ID, PortalWorkspace} from '@/types';
import {BankTransferDetailsType} from '@/ui/components/payment/types';
import type {PendingHubPispContext} from '@/lib/core/payment/hubpisp/orm';
import type {PaymentUpdateStatus} from '@/lib/core/payment/sse';

export type Invoice = {
  id: ID;
  invoiceId: string;
  invoiceDate: string;
  inTaxTotal: string;
  exTaxTotal: number | string;
  taxTotal: string;
  invoicePaymentList?: any[];
  amountRemaining: {value: string; symbol: string; formattedValue: string};
  currency: {
    id: string | number;
    symbol: string;
  };
  isUnpaid: boolean;
  dueDate: string;
  pendingStripeBankTransferIntents?: BankTransferDetailsType[];
  pendingHubPispContexts?: PendingHubPispContext[];
};

export type InvoiceProps = {
  invoiceId: string | number;
  downloadURL: string;
};

export type TotalProps = {
  invoice: Invoice;
  isUnpaid?: boolean;
  workspace?: PortalWorkspace;
  invoiceType: string;
  workspaceURI: string;
  token?: string;
  onPaymentUpdate?: (status: PaymentUpdateStatus) => void;
};
