export const SORT_BY_OPTIONS = [
  {
    value: 'byNewest',
    label: 'New',
  },
  {
    value: 'byFeature',
    label: 'Featured',
  },
  {
    value: 'byAToZ',
    label: 'Name: A-Z',
  },
  {
    value: 'byZToA',
    label: 'Name: Z-A',
  },
  {
    value: 'byLessExpensive',
    label: 'Price: Low-High',
  },
  {
    value: 'byMostExpensive',
    label: 'Price: High-Low',
  },
] as const;

/* The catalogue opens A-Z when the workspace offers that ordering, so it reads
   the same as a workspace that configured no ordering at all — the query falls
   back to the same one. Otherwise the first ordering the workspace offers. */
export const DEFAULT_SORT_OPTION = 'byAToZ';

export const SHIPPING_TYPE = {
  REGULAR: 'regular',
  FAST: 'fast',
};

export const ORDER_SUCCESS_PARAM = 'order_success';
