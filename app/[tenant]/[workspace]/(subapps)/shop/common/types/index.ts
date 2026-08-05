import type {CartItem, ComputedProduct} from '@/types';

export type Breadcrumb = {id: string | number; name: string};

export type EnrichedCartItem = CartItem & {computedProduct?: ComputedProduct};
