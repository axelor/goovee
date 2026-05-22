import {z} from 'zod';

import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';

import {DEFAULT_CURRENCY_SCALE} from '@/constants';

import {computePrice, type CurrencyInput} from '../utils/price';
import {withProductAccessFilter} from '../orm/helpers';
import {buildPriceContext} from '../orm/orm';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';

/* Per-product availability check shared by validateCart and
 * recheckCartAvailability. Returns a translated error message if the
 * product can't be granted to the partner right now, null otherwise. */
type AvailabilityRow = {
  id: string;
  name: string | null;
  slug: string | null;
  currentVersion: {id: string} | null;
  marketplaceProductPurchaseList: Array<{id: string}> | null;
};
async function checkAvailability(
  product: AvailabilityRow,
): Promise<string | null> {
  const label = product.name ?? product.slug ?? product.id;
  if (!product.currentVersion) {
    return t('{0} has no published version.', label);
  }
  if ((product.marketplaceProductPurchaseList?.length ?? 0) > 0) {
    return t('{0} is already in your purchases.', label);
  }
  return null;
}

export const CartProductIdsSchema = z
  .array(z.string().min(1))
  .min(1, 'Cart cannot be empty');

export type ValidatedCartItem = {
  productId: string;
  productSlug: string;
  name: string;
  priceAti: number;
  scale: number;
  currencyCode: string;
  currencySymbol: string | null;
};

export type ValidatedCart = {
  items: ValidatedCartItem[];
  total: number;
  currencyCode: string;
};

/* Validate a list of product ids against the current DB state for the
 * checkout flow. Rules enforced (mirrors docs/marketplace-checkout-plan.md):
 *   - All ids must resolve to a marketplace product the workspace can see.
 *   - Each product must be paid (free items must never reach checkout).
 *   - Each product must have a published current version.
 *   - Partner must not already own any of them (idempotency).
 *   - All items must share a single currency (mixed-currency carts are
 *     rejected — see docs Open items).
 *
 * Returns the recomputed cart with server-authoritative prices, suitable
 * for both stashing in PaymentContext and asserting against `paidAmount`
 * on the return leg. */
export async function validateCart({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string;
  productIds: string[];
}) {
  const dedupedIds = Array.from(new Set(productIds));
  if (dedupedIds.length === 0) {
    return {error: true as const, message: await t('Your cart is empty.')};
  }

  /* Single query for everything checkout needs:
   *   - workspace access (`getProductAccessFilter`) so private/foreign
   *     products are filtered out at the DB level rather than slipped
   *     through;
   *   - per-partner ownership rows via the
   *     `marketplaceProductPurchaseList` back-relation — non-empty
   *     means the partner already owns this product;
   *   - tax chain for `computePrice`. */
  const products = await client.aOSProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: dedupedIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      salePrice: true,
      inAti: true,
      saleCurrency: {
        id: true,
        code: true,
        symbol: true,
        numberOfDecimals: true,
      },
      currentVersion: {id: true, statusSelect: true},
      marketplaceProductPurchaseList: {
        where: {partner: {id: mainPartnerId}},
        select: {id: true},
      },
      accountManagementList: {
        select: {
          company: {id: true},
          saleTaxSet: {
            select: {
              activeTaxLine: {value: true},
              taxLineList: {
                select: {value: true, startDate: true, endDate: true},
              },
            },
          },
        },
      },
      productFamily: {
        accountManagementList: {
          select: {
            company: {id: true},
            saleTaxSet: {
              select: {
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

  if (products.length !== dedupedIds.length) {
    return {
      error: true as const,
      message: await t('Some items in your cart are no longer available.'),
    };
  }

  const {conversionLines, viewerCurrency, defaultCurrency} =
    await buildPriceContext({
      client,
      mainPartnerId,
      productCurrencyCodes: products.map(p => p.saleCurrency?.code),
    });

  const items: ValidatedCartItem[] = [];
  let currencyCode: string | null = null;
  for (const product of products) {
    const unavailable = await checkAvailability(product);
    if (unavailable) return {error: true as const, message: unavailable};
    const productCurrency: CurrencyInput | null = product.saleCurrency?.code
      ? {
          code: product.saleCurrency.code,
          symbol: product.saleCurrency.symbol ?? '',
          numberOfDecimals: product.saleCurrency.numberOfDecimals,
        }
      : null;
    const price = computePrice(product, {
      companyId: workspace.config.company?.id,
      companyTimezone: workspace.config.company?.timezone,
      scale: product.saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
      productCurrency,
      viewerCurrency,
      defaultCurrency,
      conversionLines,
    });
    if (price.ati <= 0) {
      return {
        error: true as const,
        message: await t(
          '{0} is not a paid product.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    if (!price.currency.code) {
      return {
        error: true as const,
        message: await t(
          '{0} could not be priced in a supported currency.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    if (currencyCode == null) currencyCode = price.currency.code;
    else if (currencyCode !== price.currency.code) {
      return {
        error: true as const,
        message: await t(
          'Your cart contains items in different currencies, which is not supported.',
        ),
      };
    }
    items.push({
      productId: product.id,
      productSlug: product.slug ?? '',
      name: product.name ?? '',
      priceAti: price.ati,
      scale: price.currency.numberOfDecimals,
      currencyCode: price.currency.code,
      currencySymbol: price.currency.symbol || null,
    });
  }

  const total = items.reduce((sum, item) => sum + item.priceAti, 0);

  return {
    success: true as const,
    data: {
      items,
      total,
      currencyCode: currencyCode!,
    } satisfies ValidatedCart,
  };
}

/* Time-sensitive re-check used on the payment-return leg. The validated
 * cart (with server-stamped prices) is already in PaymentContext from
 * the prepare step, so we don't recompute prices here — that would risk
 * rejecting a payment we already captured if a tax/currency line moved
 * between prepare and return. We only re-assert the invariants that can
 * actually change in that window:
 *   - workspace still allows the buyer to see the product;
 *   - product still has a published currentVersion;
 *   - partner doesn't already own it (another tab/session may have
 *     completed a parallel purchase). */
export async function recheckCartAvailability({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string;
  productIds: string[];
}) {
  const dedupedIds = Array.from(new Set(productIds));
  if (dedupedIds.length === 0) {
    return {error: true as const, message: await t('Your cart is empty.')};
  }
  const products = await client.aOSProduct.find({
    where: withProductAccessFilter(workspace)({id: {in: dedupedIds}}),
    select: {
      id: true,
      slug: true,
      name: true,
      currentVersion: {id: true},
      marketplaceProductPurchaseList: {
        where: {partner: {id: mainPartnerId}},
        select: {id: true},
      },
    },
  });
  if (products.length !== dedupedIds.length) {
    return {
      error: true as const,
      message: await t('Some items in your cart are no longer available.'),
    };
  }
  for (const product of products) {
    const unavailable = await checkAvailability(product);
    if (unavailable) return {error: true as const, message: unavailable};
  }
  return {success: true as const};
}
