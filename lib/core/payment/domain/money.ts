import type {Client} from '@/goovee/.generated/client';
import {DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SCALE} from '@/constants';

/**
 * Converts a decimal amount, as the ERP stores it, to integer minor units.
 * Works on the decimal string so 10.50 becomes 1050 and never 1049. A number
 * is first written out at the currency's scale, because a float may carry
 * noise in digits the currency does not have; a string is taken as written.
 *
 * @throws when the value is not a number or carries more decimals than the
 *   currency has.
 */
export function toMinorUnits(value: string | number, scale: number): number {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`Not a decimal amount: "${value}"`);
  }
  const text = typeof value === 'number' ? value.toFixed(scale) : value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) {
    throw new Error(`Not a decimal amount: "${text}"`);
  }
  const [, sign, whole, fraction = ''] = match;
  const significant = fraction.replace(/0+$/, '');
  if (significant.length > scale) {
    throw new Error(
      `"${text}" has more decimals than a currency with scale ${scale}`,
    );
  }
  const minor = Number(
    `${whole}${fraction.padEnd(scale, '0').slice(0, scale)}`,
  );
  return sign === '-' ? -minor : minor;
}

/* ISO 4217 currencies whose minor unit is not the usual hundredth. Providers
 * that report decimal strings are converted with this at their edge; the
 * payment's own scale, frozen from the ERP at T1, decides how the ledger sums. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'PYG',
  'RWF',
  'UGX',
  'UYI',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD',
  'IQD',
  'JOD',
  'KWD',
  'LYD',
  'OMR',
  'TND',
]);

/** The number of decimals a currency has under ISO 4217. */
export function scaleOfCurrency(code: string): number {
  const upper = code.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 3;
  return 2;
}

/** The decimal string for an amount in minor units: 1050 with scale 2 is "10.50". */
export function fromMinorUnits(minor: number, scale: number): string {
  const sign = minor < 0 ? '-' : '';
  const digits = String(Math.abs(minor)).padStart(scale + 1, '0');
  if (scale === 0) {
    return `${sign}${digits}`;
  }
  return `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

/**
 * The minor units of a bigint column, which the client returns as a string.
 * Null and undefined read as zero, which is what an unset captured amount is.
 */
export function minorUnitsOf(
  value: string | number | null | undefined,
): number {
  if (value == null || value === '') {
    return 0;
  }
  const minor = Number(value);
  if (!Number.isSafeInteger(minor)) {
    throw new Error(`Not an amount in minor units: "${value}"`);
  }
  return minor;
}

export type CurrencyInfo = {
  code: string;
  scale: number;
};

/**
 * The ISO code and scale of a currency, from the ERP's currency table. Falls
 * back to the deployment default when the code names nothing, so a payment can
 * still be priced in the currency the subject was issued in.
 */
export async function resolveCurrency(
  client: Client,
  code: string | null | undefined,
): Promise<CurrencyInfo> {
  const wanted = (code || DEFAULT_CURRENCY_CODE).toUpperCase();
  const currency = await client.aOSCurrency.findOne({
    where: {codeISO: wanted},
    select: {codeISO: true, numberOfDecimals: true},
  });
  return {
    code: currency?.codeISO ?? wanted,
    scale: currency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
  };
}
