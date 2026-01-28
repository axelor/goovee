import Stripe from 'stripe';

// ---- CORE IMPORTS ---- //
import {getCountryName} from '@/utils/country';
import {NormalizedBankDetails} from '@/ui/components/payment/types';
import {BankTransferCurrency, CountryCode, StripeBankTransfer} from './types';
import {
  BANK_ACCOUNT_TYPE,
  BANK_TRANSFER_CONFIGS,
  BANK_TRANSFER_CURRENCY,
  BANK_TRANSFER_TYPE,
  COUNTRY_TO_BANK_TRANSFER,
} from './constants';

export function getBankTransferConfig(
  currency: string,
  countryCode?: CountryCode,
): StripeBankTransfer {
  const normalizedCurrency = currency.toLowerCase() as BankTransferCurrency;
  const currencyConfig = BANK_TRANSFER_CONFIGS[normalizedCurrency];

  if (!currencyConfig) {
    throw new Error(
      `Stripe bank transfers via customer balance do not support currency "${currency.toUpperCase()}"`,
    );
  }

  // USD → no country, ever
  if (normalizedCurrency === BANK_TRANSFER_CURRENCY.USD) {
    return {
      type: BANK_TRANSFER_TYPE.US,
    };
  }

  // EUR → validate country
  if (countryCode) {
    const countryConfig = COUNTRY_TO_BANK_TRANSFER[countryCode];

    if (!countryConfig) {
      throw new Error(
        `Bank transfer is not supported for country: ${countryCode}`,
      );
    }

    if (countryConfig.currency !== normalizedCurrency) {
      throw new Error(
        `Country "${countryCode}" does not support ${currency.toUpperCase()} bank transfers`,
      );
    }

    return {
      type: BANK_TRANSFER_TYPE.EU,
      eu_bank_transfer: {
        country: countryCode,
      },
    };
  }

  // EUR fallback → default country for currency
  return {
    type: BANK_TRANSFER_TYPE.EU,
    eu_bank_transfer: {
      country: currencyConfig.default,
    },
  };
}

export function getBankDetailsFromInstructions(
  instructions?: Stripe.PaymentIntent.NextAction.DisplayBankTransferInstructions,
): NormalizedBankDetails | null {
  const financialAddress = instructions?.financial_addresses?.[0];
  if (!financialAddress) return null;

  switch (financialAddress.type) {
    case BANK_ACCOUNT_TYPE.IBAN: {
      const iban = financialAddress.iban;
      if (!iban) return null;

      return {
        type: BANK_ACCOUNT_TYPE.IBAN,
        iban: iban.iban,
        swiftCode: iban.bic ?? undefined,
        accountHolderName: iban.account_holder_name ?? undefined,
        country: getCountryName(iban.country),
        bankAddress: iban.bank_address ?? undefined,
        accountHolderAddress: iban.account_holder_address ?? undefined,
      };
    }

    case BANK_ACCOUNT_TYPE.ABA: {
      const aba = financialAddress.aba;
      if (!aba) return null;

      return {
        type: BANK_ACCOUNT_TYPE.ABA,
        routingNumber: aba.routing_number,
        accountNumber: aba.account_number,
        bankName: aba.bank_name ?? undefined,
        accountType: aba.account_type ?? undefined,
      };
    }

    default:
      return null;
  }
}
