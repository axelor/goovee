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

export type ColumnProps = {
  key: string;
  label: string;
};
export type QuotationsTableProps = {
  columns: ColumnProps[];
  quotations: Quotation[];
  onClick: (id: string | number) => void;
};

export type CardViewProps = {
  quotations: Quotation[];
  onClick: (id: string | number) => void;
};

export type Product = {
  id: ID;
  productName: string;
  qty: string | number;
  exTaxTotal: string;
  discountAmount: string | number;
  priceDiscounted: string;
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
    addressl4: string;
    addressl6: string;
    zip: string;
    country: {
      id: ID;
      name: string;
    };
    fullName?: string;
    formattedFullName?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  endOfValidityDate: string | null | undefined;
  exTaxTotal: string;
  displayExTaxTotal: string;
  id: ID;
  inTaxTotal: string;
  displayInTaxTotal: string;
  mainInvoicingAddress: {
    id: ID;
    addressl4: string;
    addressl6: string;
    zip: string;
    country: {
      id: ID;
      name: string;
    };
    fullName?: string;
    formattedFullName?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  saleOrderLineList: Product[];
  saleOrderSeq: string | number;
  statusSelect: string | number;
  totalDiscount: number | string;
  createdOn?: string | null;
  externalReference?: string | null;
};

export type TotalProps = {
  inTaxTotal: string;
  exTaxTotal: number | string;
  totalDiscount: number | string;
  statusSelect: string | number;
  hideDiscount: boolean;
};

export type InfoProps = {
  endOfValidityDate: string | null | undefined;
  statusSelect: string | number;
};

export type ContactProps = {
  clientPartner?: {
    fullName: string;
    id: ID;
  };
  company?: {
    id: ID;
    name: string;
  };
  mainInvoicingAddress: {
    id: ID;
    addressl4: string;
    addressl6: string;
    zip: string;
    country: {
      id: ID;
      name: string;
    };
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  deliveryAddress: {
    id: ID;
    addressl4: string;
    addressl6: string;
    zip: string;
    country: {
      id: ID;
      name: string;
    };
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
};
