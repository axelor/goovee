export const ORDER_TAB_ITEMS = [
  {
    id: '1',
    title: 'Ongoing orders',
    href: 'ongoing',
  },
  {
    id: '2',
    title: 'Completed orders',
    href: 'completed',
  },
];

export const PRODUCT_COLUMNS = [
  {key: 'productName', label: 'Product number'},
  {key: 'qty', label: 'Quantity'},
  {key: 'unit', label: 'Unit'},
  {key: 'price', label: 'Unit Price Wt'},
  {key: 'exTaxTotal', label: 'Total Wt'},
  {key: 'tax', label: 'Tax'},
  {key: 'discountAmount', label: 'Discount'},
  {key: 'inTaxTotal', label: 'Total ATI'},
];

export const PRODUCT_CARD_COLUMNS = [
  {key: 'productName', label: 'Product number'},
  {key: 'qty', label: 'Quantity'},
  {key: 'inTaxTotal', label: 'Total ATI'},
  {key: 'dropdown', label: ''},
];

export const ORDER_TYPE = {
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
  UNKNOWN: 'Unknown',
};

export const ORDER_STATUS = {
  CONFIRMED: 3,
  CLOSED: 4,
};

export const ORDER_DELIVERY_STATUS = {
  DELIVERED: 3,
};

export const INVOICE_STATUS = {
  VENTILATED: 3,
  UNPAID: 0,
};

export const CUSTOMERS_DELIVERY_STATUS = {
  DRAFT: 1,
  PLANNED: 2,
  REALIZED: 3,
};

export const INVOICE = 'Invoice';
export const ORDER_NUMBER = 'Order number';
export const CUSTOMER_DELIVERY = 'Customer delivery';
export const DOWNLOAD_PDF = 'Download pdf';

export const ORDER = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;
