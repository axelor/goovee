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
];

export const SHIPPING_TYPE = {
  REGULAR: 'regular',
  FAST: 'fast',
};

export const BASE_PRODUCT_MODEL = 'com.axelor.apps.base.db.Product';
export const PRODUCT_ATTRS = 'productAttrs';
export const MANY_TO_ONE = 'many-to-one';
export const MANY_T0_MANY = 'many-to-many';
export const JSON_MANY_TO_ONE = 'json-many-to-one';
export const JSON_MANY_TO_MANY = 'json-many-to-many';
export const ORDER_SUCCESS_PARAM = 'order_success';
