import {DEFAULT_CURRENCY_CODE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {computePrice, type ComputedPrice} from '../utils/price';
import {currencySelect, type PriceableMarketplaceProduct} from './helpers';
import {Payload, SelectOptions} from '@goovee/orm';
import {AOSTax} from '@/goovee/.generated/models';

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

/** One row from `appBase.currencyConversionLineList`. */
export type ConversionLine = Awaited<
  ReturnType<typeof fetchConversionLines>
>[number];

/** Fetches the conversion lines needed to convert between the given
 *  product currencies and any of the conversion targets (viewer +
 *  default). Filters the query to just the relevant (from, to) pairs
 *  (in both directions) so we don't pull the entire table. Returns
 *  empty when there's nothing to convert. */
export async function fetchConversionLines({
  client,
  fromCodes,
  toCodes,
}: {
  client: Client;
  fromCodes: Array<string | null | undefined>;
  toCodes: Array<string | null | undefined>;
}) {
  const tos = Array.from(
    new Set(
      toCodes.filter((c): c is string => typeof c === 'string' && c.length > 0),
    ),
  );
  if (tos.length === 0) return [];
  const froms = Array.from(
    new Set(
      fromCodes.filter(
        (c): c is string => typeof c === 'string' && c.length > 0,
      ),
    ),
  );
  if (froms.length === 0) return [];

  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      currencyConversionLineList: {
        where: {
          OR: [
            {
              startCurrency: {code: {in: froms}},
              endCurrency: {code: {in: tos}},
            },
            {
              startCurrency: {code: {in: tos}},
              endCurrency: {code: {in: froms}},
            },
          ],
        },
        select: {
          startCurrency: {code: true},
          endCurrency: {code: true},
          exchangeRate: true,
          fromDate: true,
          toDate: true,
        },
      },
    },
  });
  return appBase?.currencyConversionLineList ?? [];
}

/** Bundle of inputs `computePrice` needs that are *batch-wide* rather
 *  than per-product: the viewer/default currencies, the conversion
 *  lines covering this batch, and the buyer's fiscal position. Built
 *  once per request, reused across every product in the batch. See
 *  `utils/price.ts` for how these get consumed. */
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
    toCodes: [partnerCurrency?.code, fallbackCurrency?.code],
  });
  return {
    conversionLines,
    viewerCurrency: partnerCurrency,
    defaultCurrency: fallbackCurrency,
    fiscalPosition,
  };
}

const taxRowSelectFields = {
  id: true,
  activeTaxLine: {value: true},
  taxLineList: {
    select: {value: true, startDate: true, endDate: true},
  },
} as const satisfies SelectOptions<AOSTax>;

/** One tax in a product's `saleTaxSet`, with just the fields needed
 *  for rate resolution (active value, or a date-windowed line). */
export type TaxRow = Payload<AOSTax, {select: typeof taxRowSelectFields}>;

/** Shape `computePrice` consumes for per-buyer tax remapping. */
export type FiscalPositionInput = NonNullable<
  Awaited<ReturnType<typeof findPartnerFiscalPosition>>
>;

/** Loads the buyer partner's fiscal position with its `taxEquivList`,
 *  ready to feed `computePrice`. Returns null when the partner has
 *  none — `computePrice` then uses each tax as-is. */
export async function findPartnerFiscalPosition({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      fiscalPosition: {
        taxEquivList: {
          select: {
            fromTaxSet: {select: {id: true}},
            toTaxSet: {
              select: taxRowSelectFields,
            },
          },
        },
      },
    },
  });
  return partner?.fiscalPosition ?? null;
}

/** Looks up the app-wide fallback currency (`DEFAULT_CURRENCY_CODE`) in
 *  `AOSCurrency`. Used at product create time (`saveProduct`) and at
 *  display time (`getPriceContext`). Returns null if the row is missing
 *  — callers decide whether that's a hard failure (create) or a soft
 *  fallback (display). */
export async function findDefaultCurrency(client: Client) {
  return client.aOSCurrency.findOne({
    where: {code: DEFAULT_CURRENCY_CODE},
    select: currencySelect,
  });
}

export async function findPartnerCurrency({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      currency: currencySelect,
    },
  });
  return partner?.currency ?? null;
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
