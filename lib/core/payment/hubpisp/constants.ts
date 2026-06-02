export const HUBPISP_CONSENT_STATUS = {
  PENDING: 'PENDING',
  EXECUTED: 'EXECUTED',
  EXPIRED: 'EXPIRED',
  PROCESSED: 'PROCESSED',
} as const;

export type HubPispConsentStatus =
  (typeof HUBPISP_CONSENT_STATUS)[keyof typeof HUBPISP_CONSENT_STATUS];

export const HUBPISP_TRANSACTION_STATUS = {
  // Terminal (Final = OUI) — a final outcome has been reached, stop polling.
  ACSC: 'ACSC', // success — debtor account debited, cannot be cancelled
  CANC: 'CANC', // failure — cancelled after a cancellation request
  RJCT: 'RJCT', // failure — payment request rejected
  // Non-terminal (Final = NON) — keep polling until terminal.
  ACSP: 'ACSP', // accepted, will execute (cannot be cancelled)
  ACTC: 'ACTC', // auth + validation done (can still be cancelled)
  PDNG: 'PDNG', // still being processed; further checks to come
} as const;

export type HubPispTransactionStatus =
  (typeof HUBPISP_TRANSACTION_STATUS)[keyof typeof HUBPISP_TRANSACTION_STATUS];

export const HUBPISP_REDIRECT_STATUS = {
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type HubPispRedirectStatus =
  (typeof HUBPISP_REDIRECT_STATUS)[keyof typeof HUBPISP_REDIRECT_STATUS];

export const HUBPISP_LOCAL_INSTRUMENT = {
  SCT: 'SCT',
  INST: 'INST',
} as const;

export type HubPispLocalInstrument =
  (typeof HUBPISP_LOCAL_INSTRUMENT)[keyof typeof HUBPISP_LOCAL_INSTRUMENT];

export const HUBPISP_TRANSFER_TYPE = {
  STANDARD: 'standard',
  INSTANT: 'instant',
} as const;

// Default expiry for a payment link: 30 minutes
export const HUBPISP_DEFAULT_EXPIRE_IN = 1800;

// Default page timeout: 20 minutes
export const HUBPISP_DEFAULT_PAGE_TIMEOUT = 1200;

// HUB PISP API endpoint for initiating a payment link request
export const PAYMENT_LINK_PATH = '/nxflq/hub-pisp/v2/payment-link';

// HUB PISP API endpoint for checking the status of a payment request
export const PAYMENT_REQUEST_PATH = '/nxflq/hub-pisp/v2/payment-requests';
