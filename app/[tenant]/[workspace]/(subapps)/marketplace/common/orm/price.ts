import {DEFAULT_CURRENCY_CODE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {
  fetchConversionLines,
  findCurrencyByCodeISO,
  findPartnerCurrency,
  findPartnerFiscalPosition,
} from '@/product/orm';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {computePrice, type ComputedPrice} from '../utils/price';
import type {PriceableMarketplaceProduct} from './helpers';

/** Enriches an MP listing row with the computed `price`. The listing's
 *  own `salePrice` / `inAti` / `saleCurrency` are fed through as
 *  `priceOverride` — they win over the workspace default product's
 *  matching fields. Tax / accountManagement / fallback currency still come from
 *  `mp.product` (same path AOS takes on the SO line). */
export function withPrice<T extends PriceableMarketplaceProduct>(
  mp: T,
  workspace: PortalWorkspaceWithConfig,
  priceContext: PriceContext,
): T & {price: ComputedPrice} {
  return {
    ...mp,
    price: computePrice({
      product: mp.product,
      priceContext,
      company: workspace.config.company,
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
 *  fiscal position. Built once per request via the core fetches, reused
 *  across every product in the batch. */
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

/** The app-wide fallback currency (`DEFAULT_CURRENCY_CODE`) — a thin wrapper
 *  over the core's `findCurrencyByCodeISO`; the choice of *which* code is the
 *  app's policy. Used at product create time (`saveProduct`) and at display
 *  time (`getPriceContext`). Returns null if the row is missing — callers
 *  decide whether that's a hard failure (create) or a soft fallback (display). */
export async function findDefaultCurrency(client: Client) {
  return findCurrencyByCodeISO({client, codeISO: DEFAULT_CURRENCY_CODE});
}

/** Resolves the currency to use for a brand-new marketplace listing:
 *  publisher's partner currency → app-wide default (`DEFAULT_CURRENCY_CODE`).
 *  Single source of truth shared between the create form (display symbol)
 *  and `saveProduct` (FK stamped on insert), so the price the supplier
 *  types is interpreted in the same currency that gets persisted.
 *  Existing listings keep their own `saleCurrency` — this helper is not
 *  consulted on edit. */
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
