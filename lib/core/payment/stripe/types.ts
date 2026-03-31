// ---- CORE IMPORTS ---- //
import {
  BANK_ACCOUNT_TYPE,
  BANK_TRANSFER_CURRENCY,
  BANK_TRANSFER_STATUS,
  BANK_TRANSFER_TYPE,
} from '@/payment/stripe/constants';

export type BankTransferStatus =
  (typeof BANK_TRANSFER_STATUS)[keyof typeof BANK_TRANSFER_STATUS];

export type BankTransferType =
  (typeof BANK_TRANSFER_TYPE)[keyof typeof BANK_TRANSFER_TYPE];

export type CountryCode = 'FR' | 'DE' | 'ES' | 'IT' | 'NL' | 'BE' | 'US';

export type BankAccountType =
  (typeof BANK_ACCOUNT_TYPE)[keyof typeof BANK_ACCOUNT_TYPE];

export type StripeBankTransfer =
  | {
      type: typeof BANK_TRANSFER_TYPE.EU;
      eu_bank_transfer: {
        country: CountryCode;
      };
    }
  | {
      type: typeof BANK_TRANSFER_TYPE.US;
    };

export type BankTransferCurrency =
  (typeof BANK_TRANSFER_CURRENCY)[keyof typeof BANK_TRANSFER_CURRENCY];
