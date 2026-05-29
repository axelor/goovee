import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {ActionResponse} from '@/types/action';
import {z} from 'zod';
import {
  buildPriceContext,
  findCartProducts,
  findCartProductsAvailability,
} from '../orm';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {ComputedPrice, computePrice, round} from '../utils/price';

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
}): ActionResponse<ValidatedCart> {
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
  const products = await findCartProducts({
    client,
    workspace,
    mainPartnerId,
    productIds: dedupedIds,
  });

  if (products.length !== dedupedIds.length) {
    return {
      error: true,
      message: await t('Some items in your cart are no longer available.'),
    };
  }

  const priceContext = await buildPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(p => p.saleCurrency?.code),
  });

  const items: ValidatedCartItem[] = [];
  let currency: ComputedPrice['currency'] | null = null;
  for (const product of products) {
    const unavailable = await checkAvailability(product);
    if (unavailable) return {error: true as const, message: unavailable};
    const price = computePrice({
      product,
      priceContext: priceContext,
      company: workspace.config.company,
    });
    if (price.ati <= 0) {
      return {
        error: true,
        message: await t(
          '{0} is not a paid product.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    if (!price.currency.code) {
      return {
        error: true,
        message: await t(
          '{0} could not be priced in a supported currency.',
          product.name ?? product.slug ?? product.id,
        ),
      };
    }
    if (!currency) currency = price.currency;
    else if (currency.code !== price.currency.code) {
      return {
        error: true,
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

  if (!currency) throw new Error('No currency found');

  const total = items.reduce((sum, item) => sum + item.priceAti, 0);

  return {
    success: true,
    data: {
      items,
      total: round(total, currency.numberOfDecimals),
      currencyCode: currency.code,
    },
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
  const products = await findCartProductsAvailability({
    client,
    workspace,
    mainPartnerId,
    productIds: dedupedIds,
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
