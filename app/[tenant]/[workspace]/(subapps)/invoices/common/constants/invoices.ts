// ---- CORE IMPORTS ---- //

const HEADING =
  'You have unpaid invoices that will soon reach their limit date.';

const INVOICE = {
  PAID: 'paid',
  UNPAID: 'unpaid',
};
const INVOICE_TAB_ITEMS = [
  {
    id: '1',
    title: 'Unpaid invoices',
    href: INVOICE.UNPAID,
  },
  {
    id: '2',
    title: 'Paid invoices',
    href: INVOICE.PAID,
  },
];

const INVOICE_TYPE = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
};

const INVOICE_CATEGORY = {
  SALE_INVOICE: 3,
};

const INVOICE_STATUS = {
  VENTILATED: 3,
  UNPAID: 0,
};
enum INVOICE_PAYMENT_OPTIONS {
  NO = 'no',
  TOTAL = 'total',
  PARTIAL = 'partial',
}

export {
  HEADING,
  INVOICE_TAB_ITEMS,
  INVOICE_TYPE,
  INVOICE_STATUS,
  INVOICE_CATEGORY,
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
};
