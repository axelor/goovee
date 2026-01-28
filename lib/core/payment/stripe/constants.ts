export const BANK_TRANSFER_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
} as const;

export const PAYMENT_INTENT_STATUS = {
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  REQUIRES_ACTION: 'requires_action',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  CANCELED: 'canceled',
} as const;

export const STRIPE_CANCELLATION_REASONS = {
  // Customer started the payment but never completed it
  ABANDONED: 'abandoned',
  // Payment was created twice for the same order or invoice
  DUPLICATE: 'duplicate',
  // Payment was flagged as suspicious or potentially fraudulent
  FRAUDULENT: 'fraudulent',
  // Customer explicitly requested to cancel the payment
  REQUESTED_BY_CUSTOMER: 'requested_by_customer',
} as const;

export const STRIPE_PAYMENT_METHOD_TYPE = {
  CARD: 'card',
  CUSTOMER_BALANCE: 'customer_balance',
} as const;
