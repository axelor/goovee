export const HUBPISP_CONSENT_STATUS = {
  PENDING: 'PENDING',
  EXECUTED: 'EXECUTED',
  EXPIRED: 'EXPIRED',
  PROCESSED: 'PROCESSED',
} as const;

export type HubPispConsentStatus =
  (typeof HUBPISP_CONSENT_STATUS)[keyof typeof HUBPISP_CONSENT_STATUS];

export const HUBPISP_TRANSACTION_STATUS = {
  ACCP: 'ACCP', // Accepted by creditor agent — non-terminal
  ACSC: 'ACSC', // Settlement confirmed — terminal, success
  ACSP: 'ACSP', // Accepted, will execute — non-terminal
  ACTC: 'ACTC', // Authentication & validation done — non-terminal
  CANC: 'CANC', // Cancelled — terminal, failure
  PDNG: 'PDNG', // Pending — non-terminal
  RJCT: 'RJCT', // Rejected — terminal, failure
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

// Default expiry for a payment link: 30 minutes
export const HUBPISP_DEFAULT_EXPIRE_IN = 1800;

// Default page timeout: 20 minutes
export const HUBPISP_DEFAULT_PAGE_TIMEOUT = 1200;

// HUB PISP API endpoint for initiating a payment link request
export const PAYMENT_LINK_PATH = '/nxflq/hub-pisp/v2/payment-link';

// HUB PISP API endpoint for checking the status of a payment request
export const PAYMENT_REQUEST_PATH = '/nxflq/hub-pisp/v2/payment-requests';
