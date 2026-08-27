import {DEFAULT_CURRENCY_CODE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {
  fetchConversionLines,
  findCurrencyByCodeISO,
  findPartnerCurrency,
  findPartnerFiscalPosition,
} from '@/product/orm';
import type {MarketplaceConfig} from './config';
import {computePrice, type ComputedPrice} from '../utils/price';
import type {PriceableMarketplaceProduct} from './helpers';

/** Adds the computed `price` to a marketplace listing row. The listing's own
 *  `salePrice` / `inAti` / `saleCurrency` go through as `priceOverride` and are
 *  used as-is; `mp.product` supplies only the tax configuration. */
export function withPrice<T extends PriceableMarketplaceProduct>(
  mp: T,
  config: MarketplaceConfig,
  priceContext: PriceContext,
): T & {price: ComputedPrice} {
  return {
    ...mp,
    price: computePrice({
      product: mp.product,
      priceContext,
      company: config.company,
      priceOverride: {
        salePrice: mp.salePrice,
        saleCurrency: mp.saleCurrency,
        inAti: mp.inAti,
      },
    }),
  };
}

/** Bundle of inputs `computePrice` needs that are *batch-wide* rather than
 *  per-product: the viewer/default currencies (the storefront display
 *  cascade), the conversion lines covering this batch, and the buyer's
 *  fiscal position. Built once per query and reused for every product in
 *  it. */
export type PriceContext = Awaited<ReturnType<typeof getPriceContext>>;
export async function getPriceContext({
  client,
  mainPartnerId,
  productCurrencyCodes,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
  productCurrencyCodes: Array<string | null | undefined>;
}) {
  const [partnerCurrency, fallbackCurrency, fiscalPosition] = await Promise.all(
    [
      findPartnerCurrency({client, mainPartnerId}),
      findDefaultCurrency(client),
      findPartnerFiscalPosition({client, mainPartnerId}),
    ],
  );
  const conversionLines = await fetchConversionLines({
    client,
    fromCodes: productCurrencyCodes,
    toCodes: [partnerCurrency?.codeISO, fallbackCurrency?.codeISO],
  });
  return {
    conversionLines,
    viewerCurrency: partnerCurrency,
    defaultCurrency: fallbackCurrency,
    fiscalPosition,
  };
}

/** The app-wide fallback currency — a thin wrapper over the core's
 *  `findCurrencyByCodeISO`, where the choice of *which* code is the app's
 *  policy. Returns null when the row is missing, and callers differ on what
 *  that means: a hard failure at create, a soft fallback at display time. */
export async function findDefaultCurrency(client: Client) {
  return findCurrencyByCodeISO({client, codeISO: DEFAULT_CURRENCY_CODE});
}

/** Resolves the currency to use for a brand-new marketplace listing:
 *  publisher's partner currency → app-wide default (`DEFAULT_CURRENCY_CODE`).
 *  One value feeds both the price input's currency symbol and the FK written
 *  on insert, so the price a publisher types is interpreted in the currency it
 *  is stored in. An existing listing keeps its own `saleCurrency` — this is
 *  only the default for a new one. */
export async function resolveNewListingCurrency({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  const partnerCurrency = await findPartnerCurrency({client, mainPartnerId});
  if (partnerCurrency) return partnerCurrency;
  return findDefaultCurrency(client);
}
