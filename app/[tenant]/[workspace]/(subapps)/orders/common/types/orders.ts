// ---- CORE IMPORTS ---- //
import type {Address, ID, Product, Unit} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {ORDER} from '@/subapps/orders/common/constants/orders';

export type Order = {
  id: ID;
  orderNumber: string;
  saleOrderSeq: string;
  StatusSelect: number;
  creationDate: Date | string;
  totalCostPrice: number;
  taxTotal: number;
  template: boolean;
  createdOn: string;
  archived: boolean;
  shipmentMode?: {
    name: string;
  };
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
  deliveryAddress?: Address;
  mainInvoicingAddress?: Address;
  inTaxTotal: number;
  exTaxTotal: number;
  companyExTaxTotal: number;
  statusSelect: 1 | 2 | 3 | 4 | 5;
  invoicingState: 1 | 2 | 3;
  deliveryState: 1 | 2 | 3;
  saleOrderLineList: SaleOrder[];
};

export type SaleOrder = {
  id: ID;
  productName: string;
  price: number;
  discountAmount: number;
  priceDiscounted: number;
  deliveredQty: string;
  product?: Product;
  qty: number;
  unit: Unit;
  exTaxTotal: number;
  inTaxTotal: number;
};

export type Invoice = {
  id: ID;
  invoiceId: string;
  invoiceDate: string;
};

export type OrderType = (typeof ORDER)[keyof typeof ORDER];
