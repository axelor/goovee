import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import {ActionResponse} from '@/types/action';
import {z} from 'zod';
import {
  getPriceContext,
  findCartProducts,
  findCartProductsAvailability,
} from '../orm';
import type {Workspace} from '@/orm/workspace';
import type {MarketplaceConfig} from '../orm/config';
import {ComputedPrice, computePrice, round} from '../utils/price';

export const CartProductIdsSchema = z
  .array(z.string().min(1))
  .min(1, 'Cart cannot be empty');

export type ValidatedCartItem = {
  productId: string;
  productSlug: string;
  name: string;
  /** Price without tax — persisted on the purchase record for revenue. */
  priceWt: number;
  priceAti: number;
  /** Applied tax rate — persisted alongside the price for revenue. */
  taxRate: number;
  scale: number;
  /** ISO 4217 code — the machine identity fed to payment providers and
   *  the AOS order endpoint. Display uses `currencySymbol`. */
  currencyCodeISO: string;
  currencySymbol: string | null;
};

export type ValidatedCart = {
  items: ValidatedCartItem[];
  total: number;
  currencyCodeISO: string;
};

/* Validate a list of product ids against the current DB state for the
 * checkout flow. Rules enforced:
 *   - All ids must resolve to a marketplace product the workspace can see.
 *   - Each product must be paid (free items must never reach checkout).
 *   - Each product must be storefront-visible: at least one published,
 *     non-archived version, and the product itself not taken down.
 *   - Partner must not already own any of them.
 *   - All items must share a single currency; mixed carts are rejected.
 *
 * Returns the cart re-priced from current DB state — these amounts are
 * authoritative, not the client's. They are stashed in PaymentContext at
 * prepare and asserted against `paidAmount` on the return leg. */
export async function validateCart({
  client,
  workspace,
  config,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: Workspace;
  config: MarketplaceConfig;
  mainPartnerId: string;
  productIds: string[];
}): ActionResponse<ValidatedCart> {
  const dedupedIds = Array.from(new Set(productIds));
  if (dedupedIds.length === 0) {
    return {error: true as const, message: await t('Your cart is empty.')};
  }

  /* Two queries in parallel: the visible-product query
   * (`withPublishedProductFilter`, so an invisible product is dropped at the
   * DB level rather than slipped through), which also carries the tax chain
   * `computePrice` needs; and a purchase lookup that only sets `isOwned`. */
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

  const priceContext = await getPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: products.map(
      product =>
        product.saleCurrency?.codeISO ?? product.product?.saleCurrency?.codeISO,
    ),
  });

  const items: ValidatedCartItem[] = [];
  let currency: ComputedPrice['currency'] | null = null;
  for (const product of products) {
    if (product.isOwned) {
      return {
        error: true as const,
        message: await t('{0} is already in your purchases.', product.name),
      };
    }
    const price = computePrice({
      product: product.product,
      priceContext,
      company: config.company,
      priceOverride: {
        salePrice: product.salePrice,
        saleCurrency: product.saleCurrency,
        inAti: product.inAti,
      },
    });
    if (price.ati <= 0) {
      return {
        error: true,
        message: await t('{0} is not a paid product.', product.name),
      };
    }
    /* Currency identity is the ISO code — it's what the payment
     * providers and the AOS order endpoint consume; the printing code
     * and symbol are display-only. */
    if (!price.currency.codeISO) {
      return {
        error: true,
        message: await t(
          '{0} could not be priced in a supported currency.',
          product.name,
        ),
      };
    }
    if (!currency) currency = price.currency;
    else if (currency.codeISO !== price.currency.codeISO) {
      return {
        error: true,
        message: await t(
          'Your cart contains items in different currencies, which is not supported.',
        ),
      };
    }
    items.push({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      priceWt: price.wt,
      priceAti: price.ati,
      taxRate: price.taxRate,
      scale: price.currency.numberOfDecimals,
      currencyCodeISO: price.currency.codeISO,
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
      currencyCodeISO: currency.codeISO,
    },
  };
}

/* Time-sensitive re-check used on the payment-return leg. The validated
 * cart (with server-set prices) is already in PaymentContext from
 * the prepare step, so we don't recompute prices here — that would risk
 * rejecting a payment we already captured if a tax/currency line moved
 * between prepare and return. We only re-assert the invariants that can
 * actually change in that window:
 *   - workspace still allows the buyer to see the product;
 *   - product is still storefront-visible (a published, non-archived
 *     version, and not taken down);
 *   - partner doesn't already own it (another tab/session may have
 *     completed a parallel purchase). */
export async function recheckCartAvailability({
  client,
  workspace,
  mainPartnerId,
  productIds,
}: {
  client: Client;
  workspace: Workspace;
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
    if (product.isOwned) {
      return {
        error: true as const,
        message: await t('{0} is already in your purchases.', product.name),
      };
    }
  }
  return {success: true as const};
}
