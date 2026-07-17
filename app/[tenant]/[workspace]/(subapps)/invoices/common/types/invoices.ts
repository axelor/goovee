// ---- CORE IMPORTS ---- //
import type {Cloned} from '@/types/util';
import type {PaymentUpdateStatus} from '@/lib/core/payment/sse';
import {BankAccountType} from '@/lib/core/payment/stripe/types';
import {HubPispLocalInstrument} from '@/lib/core/payment/hubpisp/constants';

// ---- LOCAL IMPORTS ---- //
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';

export type InvoiceListItem = {
  id: string;
  invoiceId: string | null;
  invoiceDate: string | null;
  dueDate: string;
  exTaxTotal: string;
  inTaxTotal: string;
  amountRemaining: {
    value: string | null;
    symbol: string;
    formattedValue: string | number | null | undefined;
  };
  isUnpaid: boolean;
};

export type PaymentListItem = {
  id: string;
  version: number;
  paymentDate: string | null;
  amount: string | number | null | undefined;
};

export type Invoice = {
  id: string;
  version: number;
  invoiceId: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  exTaxTotal: string | number | null | undefined;
  inTaxTotal: string | number | null | undefined;
  amountRemaining: {
    value: string | null;
    symbol: string;
    formattedValue: string | number | null | undefined;
  };
  taxTotal: string | number | null | undefined;
  invoicePaymentList: PaymentListItem[];
  isUnpaid: boolean;
  pendingStripeBankTransferIntents: {
    id: string;
    totalAmount: number;
    formattedTotalAmount: string;
    amount: number;
    currency: string;
    reference: string;
    formattedAmount: string;
    bankDetails: {
      type: BankAccountType;
      accountHolderName?: string | undefined;
      bankName?: string | undefined;
      country?: string | undefined;
      iban?: string | undefined;
      swiftCode?: string | undefined;
      routingNumber?: string | undefined;
      accountNumber?: string | undefined;
      accountType?: string | undefined;
      bankAddress?:
        | {
            line1?: (string | null) | undefined;
            line2?: (string | null) | undefined;
            city?: (string | null) | undefined;
            state?: (string | null) | undefined;
            postal_code?: (string | null) | undefined;
            country?: (string | null) | undefined;
          }
        | undefined;
      accountHolderAddress?:
        | {
            line1?: (string | null) | undefined;
            line2?: (string | null) | undefined;
            city?: (string | null) | undefined;
            state?: (string | null) | undefined;
            postal_code?: (string | null) | undefined;
            country?: (string | null) | undefined;
          }
        | undefined;
    };
    contextId: string;
    initiatedDate: Date;
  }[];
  pendingHubPispContexts: {
    contextId: string;
    amount: string;
    initiatedDate: Date;
    localInstrument: HubPispLocalInstrument;
    resourceId: string;
  }[];
  company: {
    id: string;
    version: number;
    partner: {
      id: string;
      version: number;
      fixedPhone: string | null;
    } | null;
    address: {
      id: string;
      version: number;
      addressl2: string | null;
      addressl4: string | null;
      addressl6: string | null;
      country: {
        id: string;
        version: number;
        name: string | null;
        alpha2Code: string | null;
      } | null;
      zip: string | null;
    } | null;
    name: string | null;
  } | null;
  note: string | null;
  partner: {
    id: string;
    version: number;
    name: string | null;
    firstName: string | null;
    simpleFullName: string | null;
    emailAddress: {
      id: string;
      version: number;
      address: string | null;
    } | null;
    fixedPhone: string | null;
    mainAddress: {
      id: string;
      version: number;
      addressl2: string | null;
      addressl4: string | null;
      addressl6: string | null;
      country: {
        id: string;
        version: number;
        name: string | null;
      } | null;
      zip: string | null;
    } | null;
  } | null;
  paymentCondition: {
    id: string;
    version: number;
    name: string | null;
  } | null;
  currency: {
    id: string;
    version: number;
    symbol: string | null;
    code: string | null;
    numberOfDecimals: number | null;
  } | null;
  address: {
    id: string;
    version: number;
    addressl2: string | null;
    addressl4: string | null;
    addressl6: string | null;
    country: {
      id: string;
      version: number;
      name: string | null;
      alpha2Code: string | null;
      numericCode?: string | null;
    } | null;
    zip: string | null;
    city: {
      id: string;
      version: number;
      name: string | null;
    } | null;
  } | null;
};

export type InvoiceProps = {
  invoiceId: string | number;
  downloadURL: string;
};

export type TotalProps = {
  invoice: Cloned<Invoice>;
  isUnpaid?: boolean;
  config: InvoicesConfig | Cloned<InvoicesConfig>;
  invoiceType: string;
  workspaceURI: string;
  token?: string;
  onPaymentUpdate?: (status: PaymentUpdateStatus) => void;
};
