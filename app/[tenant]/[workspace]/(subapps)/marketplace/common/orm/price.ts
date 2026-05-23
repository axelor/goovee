import {DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SCALE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {
  computePrice,
  type ComputedPrice,
  type ConversionLine,
  type CurrencyInput,
  type FiscalPositionInput,
} from '../utils/price';
import type {PriceableProduct} from './helpers';

export type PriceContext = {
  conversionLines: ConversionLine[];
  viewerCurrency: CurrencyInput | null;
  defaultCurrency: CurrencyInput | null;
  fiscalPosition: FiscalPositionInput | null;
};

function toCurrencyInput(
  c:
    | {
        code?: string | null;
        symbol?: string | null;
        numberOfDecimals?: number | null;
      }
    | null
    | undefined,
): CurrencyInput | null {
  if (!c?.code) return null;
  return {
    code: c.code,
    symbol: c.symbol ?? '',
    numberOfDecimals: c.numberOfDecimals,
  };
}

export function withPrice<T extends PriceableProduct>(
  product: T,
  workspace: PortalWorkspaceWithConfig,
  priceContext: PriceContext,
): T & {price: ComputedPrice} {
  const productCurrency = toCurrencyInput(product.saleCurrency);
  return {
    ...product,
    price: computePrice(product, {
      companyId: workspace.config.company?.id,
      companyTimezone: workspace.config.company?.timezone,
      scale: product.saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
      productCurrency,
      viewerCurrency: priceContext.viewerCurrency,
      defaultCurrency: priceContext.defaultCurrency,
      conversionLines: priceContext.conversionLines,
      fiscalPosition: priceContext.fiscalPosition,
    }),
  };
}

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
}): Promise<ConversionLine[]> {
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

/** Builds the PriceContext for a batch of products: resolves the viewer
 *  and default currencies, then fetches only the conversion lines
 *  between the product currencies present in the batch and either
 *  target. `computePrice` applies the three-step fallback (viewer →
 *  default → product). */
export async function buildPriceContext({
  client,
  mainPartnerId,
  productCurrencyCodes,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
  productCurrencyCodes: Array<string | null | undefined>;
}): Promise<PriceContext> {
  const [partner, fallback, fiscalPosition] = await Promise.all([
    findPartnerCurrency({client, mainPartnerId}),
    findDefaultCurrency(client),
    findPartnerFiscalPosition({client, mainPartnerId}),
  ]);
  const viewerCurrency = toCurrencyInput(partner);
  const defaultCurrency = toCurrencyInput(fallback);
  const conversionLines = await fetchConversionLines({
    client,
    fromCodes: productCurrencyCodes,
    toCodes: [viewerCurrency?.code, defaultCurrency?.code],
  });
  return {conversionLines, viewerCurrency, defaultCurrency, fiscalPosition};
}

export async function findPartnerFiscalPosition({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}): Promise<FiscalPositionInput | null> {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      fiscalPosition: {
        taxEquivList: {
          select: {
            fromTaxSet: {select: {id: true}},
            toTaxSet: {
              select: {
                id: true,
                activeTaxLine: {value: true},
                taxLineList: {
                  select: {value: true, startDate: true, endDate: true},
                },
              },
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
 *  display time (`buildPriceContext`). Returns null if the row is missing
 *  — callers decide whether that's a hard failure (create) or a soft
 *  fallback (display). */
export async function findDefaultCurrency(client: Client) {
  return client.aOSCurrency.findOne({
    where: {code: DEFAULT_CURRENCY_CODE},
    select: {id: true, code: true, symbol: true, numberOfDecimals: true},
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
      currency: {id: true, code: true, symbol: true, numberOfDecimals: true},
    },
  });
  return partner?.currency ?? null;
}
