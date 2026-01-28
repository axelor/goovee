import {BANK_TRANSFER_STATUS} from '@/payment/stripe/constants';

export type BankTransferStatus =
  (typeof BANK_TRANSFER_STATUS)[keyof typeof BANK_TRANSFER_STATUS];
