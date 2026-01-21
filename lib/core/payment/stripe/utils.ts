import Stripe from 'stripe';

// ---- CORE IMPORTS ---- //
import {getCountryName} from '@/utils/country';
import {NormalizedBankDetails} from '@/ui/components/payment/types';

export const BANK_TRANSFER_TYPE = {
  EU: 'eu_bank_transfer',
  US: 'us_bank_transfer',
} as const;

export type BankTransferType =
  (typeof BANK_TRANSFER_TYPE)[keyof typeof BANK_TRANSFER_TYPE];

export const BANK_TRANSFER_CURRENCY = {
  EUR: 'eur',
  USD: 'usd',
} as const;

export type BankTransferCurrency =
  (typeof BANK_TRANSFER_CURRENCY)[keyof typeof BANK_TRANSFER_CURRENCY];

export const BANK_ACCOUNT_TYPE = {
  IBAN: 'iban',
  ABA: 'aba',
} as const;

export type BankAccountType =
  (typeof BANK_ACCOUNT_TYPE)[keyof typeof BANK_ACCOUNT_TYPE];

export type CountryCode = 'FR' | 'DE' | 'ES' | 'IT' | 'NL' | 'BE' | 'US';

type StripeBankTransfer =
  | {
      type: typeof BANK_TRANSFER_TYPE.EU;
      eu_bank_transfer: {
        country: CountryCode;
      };
    }
  | {
      type: typeof BANK_TRANSFER_TYPE.US;
    };

const BANK_TRANSFER_CONFIGS: Record<
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

const COUNTRY_TO_BANK_TRANSFER: Record<
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
        bankName: iban.bank_name ?? undefined,
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
