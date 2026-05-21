import {z} from 'zod';

import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';

import {and} from '@/utils/orm';

import {
  computePrice,
  type ConversionLine,
  type CurrencyInput,
} from '../utils/price';
import {getProductAccessFilter} from '../orm/helpers';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';

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
  conversionLines = [],
  viewerCurrency = null,
}: {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: string | null | undefined;
  productIds: string[];
  conversionLines?: ConversionLine[];
  viewerCurrency?: CurrencyInput | null;
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
    where: and([
      getProductAccessFilter(workspace),
      {id: {in: dedupedIds}, isMarketPlace: true},
    ]),
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
      marketplaceProductPurchaseList: mainPartnerId
        ? {
            where: {partner: {id: mainPartnerId}},
            select: {id: true},
          }
        : {select: {id: true}},
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

  const items: ValidatedCartItem[] = [];
  let currencyCode: string | null = null;
  for (const product of products) {
    if (!product.currentVersion?.id) {
      return {
        error: true as const,
        message: await t(
          '{0} has no published version.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    if ((product.marketplaceProductPurchaseList?.length ?? 0) > 0) {
      return {
        error: true as const,
        message: await t(
          '{0} is already in your purchases.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    const productCurrency: CurrencyInput | null = product.saleCurrency?.code
      ? {
          code: product.saleCurrency.code,
          symbol: product.saleCurrency.symbol ?? '',
          numberOfDecimals: product.saleCurrency.numberOfDecimals,
        }
      : null;
    const workspaceCurrency = workspace.config.marketplaceDefaultSaleCurrency
      ? {
          code: workspace.config.marketplaceDefaultSaleCurrency.code ?? '',
          symbol: workspace.config.marketplaceDefaultSaleCurrency.symbol ?? '',
          numberOfDecimals:
            workspace.config.marketplaceDefaultSaleCurrency.numberOfDecimals,
        }
      : null;
    const price = computePrice(product, {
      companyId: workspace.config.company?.id,
      companyTimezone: workspace.config.company?.timezone,
      scale: product.saleCurrency?.numberOfDecimals ?? 2,
      productCurrency,
      viewerCurrency,
      workspaceCurrency,
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
        message: await t('Product is missing a currency configuration.'),
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
      scale: product.saleCurrency?.numberOfDecimals ?? 2,
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
