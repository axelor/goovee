// ---- CORE IMPORTS ---- //
import type {ID} from '@/types';

export type Quotation = {
  id: ID;
  archived?: boolean;
  createdOn: string | null;
  deliverState?: string;
  saleOrderSeq: string | null;
  statusSelect: number | string;
  externalReference: string | null;
  displayInTaxTotal?: string | null;
  endOfValidityDate?: string | null;
};

export type Product = {
  id: ID;
  productName: string;
  qty: string | number;
  exTaxTotal: string;
  discountAmount: string | number;
  priceDiscounted: string | null;
  inTaxTotal: string;
  unit: {
    name: string;
  };
  taxLineSet: Array<{
    name: string;
    value: string | number;
  }>;
  product?: {
    picture?: {
      id?: ID;
    } | null;
  } | null;
};

export type CommentsProps = {
  id: ID;
  createdOn: string;
  updatedOn: string;
  subject: string;
  body: string;
  type: string;
  author: {
    name: string | undefined;
  };
};

export type QuotationDetail = {
  clientPartner: {
    fullName: string;
    id: ID;
  };
  company: {
    id: ID;
    name: string;
  };
  currency: {
    id: ID;
    code: string;
    symbol: string;
    numberOfDecimals: number | string;
  };
  deliveryAddress: {
    id: ID;
    formattedFullName: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
  endOfValidityDate: string | null | undefined;
  exTaxTotal: string;
  displayExTaxTotal: string;
  id: ID;
  inTaxTotal: string;
  displayInTaxTotal: string;
  mainInvoicingAddress: {
    id: ID;
    formattedFullName: string | null;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
  saleOrderLineList: Product[];
  saleOrderSeq: string | number;
  statusSelect: string | number;
  totalDiscount: number | string;
  createdOn?: string | null;
  externalReference?: string | null;
};
