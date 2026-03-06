export const UP2PAY_ERRORS = {
  /** Success */
  CODE_ERROR_OPERATION_SUCCESSFUL: '00000',
  /** Connection to authorization center failed or internal error occurred */
  CODE_ERROR_AUTHORIZATION_CONNECTION_FAILED: '00001',
  /** Platform error */
  CODE_ERROR_PLATFORM_ERROR: '00003',
  /** Invalid bearer number or visual cryptogram */
  CODE_ERROR_INVALID_CARD_NUMBER_OR_CVV: '00004',
  /** Access denied or incorrect site/rank/id */
  CODE_ERROR_ACCESS_DENIED: '00006',
  /** Incorrect validity end date */
  CODE_ERROR_INVALID_EXPIRY_DATE: '00008',
  /** Error creating a subscription */
  CODE_ERROR_SUBSCRIPTION_CREATION: '00009',
  /** Unknown currency */
  CODE_ERROR_UNKNOWN_CURRENCY: '00010',
  /** Incorrect amount */
  CODE_ERROR_INCORRECT_AMOUNT: '00011',
  /** Payment already made */
  CODE_ERROR_PAYMENT_ALREADY_MADE: '00015',
  /** Existing subscriber (new subscriber registration) */
  CODE_ERROR_EXISTING_SUBSCRIBER: '00016',
  /** Card not authorized */
  CODE_ERROR_CARD_NOT_AUTHORIZED: '00021',
  /** Non-compliant card */
  CODE_ERROR_NON_COMPLIANT_CARD: '00029',
  /** Waiting time > 15 minutes by the user at the payment page */
  CODE_ERROR_TIMEOUT: '00030',
  /** Country code of buyer's IP address not authorized */
  CODE_ERROR_IP_COUNTRY_NOT_AUTHORIZED: '00033',
  /** Operation without 3D-Secure authentication, blocked by the filter */
  CODE_ERROR_3DS_BLOCKED: '00040',
  /** Operation pending validation by the issuer */
  CODE_ERROR_PENDING_ISSUER_VALIDATION: '99999',
};

/**
 * Reverse map from error code to human-readable description
 */
export const UP2PAY_ERROR_MESSAGES: Record<string, string> = Object.entries(
  UP2PAY_ERRORS,
).reduce(
  (acc, [, code]) => {
    const descriptions: Record<string, string> = {
      '00000': 'Success',
      '00001':
        'Connection to authorization center failed or internal error occurred',
      '00003': 'Platform error',
      '00004': 'Invalid bearer number or visual cryptogram',
      '00006': 'Access denied or incorrect site/rank/id',
      '00008': 'Incorrect validity end date',
      '00009': 'Error creating a subscription',
      '00010': 'Unknown currency',
      '00011': 'Incorrect amount',
      '00015': 'Payment already made',
      '00016': 'Existing subscriber',
      '00021': 'Card not authorized',
      '00029': 'Non-compliant card',
      '00030': 'Waiting time > 15 minutes at payment page',
      '00033': "Country code of buyer's IP address not authorized",
      '00040': 'Operation without 3D-Secure authentication, blocked by filter',
      '99999': 'Operation pending validation by the issuer',
    };
    acc[code] = descriptions[code] ?? `Unknown error (${code})`;
    return acc;
  },
  {} as Record<string, string>,
);

export const UP2PAY_REDIRECT_STATUS = {
  SUCCESS: 'effectue',
  CANCELLED: 'annule',
  REFUSED: 'refuse',
} as const;

export const CURRENCY_CODE: Record<string, number> = {
  EUR: 978,
};

/** Query params injected by Up2Pay on redirect (PBX_RETOUR) plus app-level params */
export const UP2PAY_REDIRECT_PARAMS = [
  'status',
  'montant',
  'ref',
  'erreur',
  'sign',
  'type',
] as const;
