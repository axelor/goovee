// ---- CORE IMPORTS ---- //
import type {ID} from '@/types';
import type {BigDecimal} from '@goovee/orm';
import {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {ORDER} from '@/subapps/orders/common/constants/orders';
import {findOrder, findOrders} from '../orm/orders';

export type OrderAddress = {
  id: ID;
  formattedFullName: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
};

export type OrderType = (typeof ORDER)[keyof typeof ORDER];

export type SaleOrderLineInput = {
  id: string;
  productName: string | null;
  qty: BigDecimal | null;
  unit?: {name: string | null} | null;
  priceDiscounted: BigDecimal | null;
  exTaxTotal: BigDecimal | null;
  discountAmount: BigDecimal | null;
  inTaxTotal: BigDecimal | null;
  product?: {picture?: {id?: string} | null} | null;
  taxLineSet?: {name: string | null; value: BigDecimal | null}[] | null;
};

export type InvoiceInput = {
  id: string;
  invoiceId: string | null;
  createdOn: Date | string | null;
};

export type CustomerDeliveryInput = {
  id: string;
  stockMoveSeq: string | null;
  createdOn: Date | string | null;
};

export type Order = Cloned<
  NonNullable<Awaited<ReturnType<typeof findOrders>>>['orders'][number]
>;

export type DetailOrder = Cloned<
  NonNullable<Awaited<ReturnType<typeof findOrder>>>
>;
