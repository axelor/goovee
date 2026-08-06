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

// SaleOrder.deliveryState selection (sale.order.delivery.state).
export const ORDER_DELIVERY_STATUS = {
  NOT_DELIVERED: 1,
  PARTIALLY_DELIVERED: 2,
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
export const CUSTOMER_DELIVERY = 'Customer delivery';
export const DOWNLOAD_PDF = 'Download pdf';

export const ORDER = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;
