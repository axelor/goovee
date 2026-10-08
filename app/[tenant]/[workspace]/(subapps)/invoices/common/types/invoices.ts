// ---- CORE IMPORTS ---- //
import type {Cloned} from '@/types/util';
import type {OfferedGateway} from '@/payment/offer';

// ---- LOCAL IMPORTS ---- //
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';
import type {PendingTransfer} from '@/subapps/invoices/common/payment/pending';

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
  isPartiallyPaid: boolean;
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
  token?: string;
  /** Transfers on this invoice still waiting on the payer's bank. */
  pendingTransfers: PendingTransfer[];
  /** The gateways this tenant and workspace offer, decided on the server. */
  gateways: OfferedGateway[];
  /** Minted when the page rendered; a second press finds the same payment. */
  checkoutToken: string;
};
