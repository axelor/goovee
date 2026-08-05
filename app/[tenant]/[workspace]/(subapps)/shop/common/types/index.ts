import type {Cart, CartItem, ComputedProduct} from '@/types';

export type Breadcrumb = {id: string | number; name: string};

export type EnrichedCartItem = CartItem & {computedProduct?: ComputedProduct};
export type EnrichedCart = Omit<Cart, 'items'> & {items: EnrichedCartItem[]};
export type ConfirmationDialog = {title: string; onContinue: () => void};

export type CheckoutCartItem = {
  product: string | number;
  quantity: string | number;
  note?: string;
  images?: string[];
  computedProduct?: ComputedProduct;
};

export type CheckoutCart = {
  items: CheckoutCartItem[];
  invoicingAddress?: string | number | null;
  deliveryAddress?: string | number | null;
};

export type SortOption = {value: string; label: string};
