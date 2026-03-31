// ---- CORE IMPORTS ---- //
import {BankTransferCurrency, BankTransferType, CountryCode} from './types';

export const BANK_TRANSFER_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
} as const;

export const BANK_TRANSFER_TYPE = {
  EU: 'eu_bank_transfer',
  US: 'us_bank_transfer',
} as const;

export const BANK_TRANSFER_CURRENCY = {
  EUR: 'eur',
  USD: 'usd',
} as const;

export const BANK_ACCOUNT_TYPE = {
  IBAN: 'iban',
  ABA: 'aba',
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

export const BANK_TRANSFER_CONFIGS: Record<
  BankTransferCurrency,
  {
    type: BankTransferType;
    recommendedCountries: CountryCode[];
    default: CountryCode;
  }
> = {
  [BANK_TRANSFER_CURRENCY.EUR]: {
    type: BANK_TRANSFER_TYPE.EU,
    recommendedCountries: ['FR', 'DE', 'ES', 'IT', 'NL', 'BE'],
    default: 'FR',
  },
  [BANK_TRANSFER_CURRENCY.USD]: {
    type: BANK_TRANSFER_TYPE.US,
    recommendedCountries: ['US'],
    default: 'US',
  },
};

export const COUNTRY_TO_BANK_TRANSFER: Record<
  CountryCode,
  {currency: BankTransferCurrency; type: BankTransferType}
> = Object.entries(BANK_TRANSFER_CONFIGS).reduce(
  (acc, [currency, config]) => {
    config.recommendedCountries.forEach(country => {
      acc[country] = {
        currency: currency as BankTransferCurrency,
        type: config.type,
      };
    });
    return acc;
  },
  {} as Record<
    CountryCode,
    {currency: BankTransferCurrency; type: BankTransferType}
  >,
);
