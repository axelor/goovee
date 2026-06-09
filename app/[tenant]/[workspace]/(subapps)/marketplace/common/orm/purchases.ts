import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProductPurchase} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {BigDecimal} from '@goovee/orm';
import {versionNumberFields, type QueryProps} from './helpers';

/** Price captured at checkout, persisted on each new purchase row. */
export type PurchasePriceInput = {
  productId: string;
  priceWt: number;
  priceAti: number;
  taxRate: number;
  /** ISO 4217 code of the charged currency; resolved to a Currency FK. */
  currencyCodeISO: string;
};

// ---- PURCHASES / OWNERSHIP ---- //

/* Marketplace ownership records. The unique (partner, marketplaceProduct)
 * constraint on the AOS side makes `recordPurchases` and
 * `attachOrderToPurchases` idempotent — safe to retry from the success
 * page or a backfill job.
 *
 * The `invoice` field is nullable: the goovee tx writes the access row
 * immediately, and the post-commit AOS HTTP call back-attaches the
 * invoice id once the SO/Invoice/InvoicePayment have been created. */

export type MarketplacePurchase = Awaited<
  ReturnType<typeof findPurchases>
>[number];

export async function findPurchases({
  client,
  workspaceId,
  mainPartnerId,
  take,
  skip,
  purchaseIds,
}: {
  client: Client;
  /** Listings are scoped to a single workspace, so purchases of products in
   *  another workspace of the same tenant must not surface here. */
  workspaceId: ID;
  mainPartnerId: ID;
  /** When provided, restricts the result to these purchase rows (still
   *  partner-scoped, so it's safe against tampered ids). */
  purchaseIds?: string[];
} & Pick<QueryProps<AOSMarketplaceProductPurchase>, 'take' | 'skip'>) {
  return client.aOSMarketplaceProductPurchase.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    where: {
      OR: [{archived: false}, {archived: null}],
      partner: {id: mainPartnerId},
      marketplaceProduct: {portalWorkspace: {id: workspaceId}},
      ...(purchaseIds?.length ? {id: {in: purchaseIds}} : {}),
    },
    orderBy: {purchasedAt: 'DESC'},
    select: {
      id: true,
      purchasedAt: true,
      marketplaceProduct: {
        id: true,
        slug: true,
        name: true,
        description: true,
        marketplaceTypeSelect: true,
        iconCode: true,
        coverStyle: true,
        currentVersion: {id: true, ...versionNumberFields},
      },
      invoice: {id: true, invoiceId: true},
      saleOrder: {id: true, saleOrderSeq: true},
    },
  });
}

/* Returns the purchase-row ids for every marketplace product in `items`
 * owned by the partner (newly created here plus any already-owned). Each new
 * row captures the price the buyer was charged. Callers use the returned ids
 * to scope the success page to exactly this checkout. */
export async function recordPurchases(
  client: Client,
  partnerId: ID,
  items: PurchasePriceInput[],
  invoiceId: ID | null = null,
): Promise<string[]> {
  if (!items.length) return [];
  const productIds = items.map(item => item.productId);
  const byProductId = new Map(items.map(item => [item.productId, item]));

  const existing = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      marketplaceProduct: {id: {in: productIds}},
    },
    select: {marketplaceProduct: {id: true}},
  });
  const existingIds = new Set(existing.map(row => row.marketplaceProduct.id));
  const missing = productIds.filter(id => !existingIds.has(id));

  // Resolve charged-currency FKs by ISO code (the cart is single-currency, but
  // resolve per distinct code to stay correct regardless).
  const currencyIdByCode = await resolveCurrencyIds(
    client,
    missing.map(id => byProductId.get(id)!.currencyCodeISO),
  );

  const now = new Date();
  for (const productId of missing) {
    const item = byProductId.get(productId)!;
    const currencyId = currencyIdByCode.get(item.currencyCodeISO);
    if (!currencyId) continue; // unknown currency — can't price the row
    try {
      await client.aOSMarketplaceProductPurchase.create({
        data: {
          partner: {select: {id: partnerId}},
          marketplaceProduct: {select: {id: productId}},
          ...(invoiceId ? {invoice: {select: {id: invoiceId}}} : {}),
          purchasedAt: now,
          priceWt: new BigDecimal(String(item.priceWt)),
          priceAti: new BigDecimal(String(item.priceAti)),
          taxRate: new BigDecimal(String(item.taxRate)),
          currency: {select: {id: currencyId}},
        },
        select: {id: true},
      });
    } catch {
      /* Unique (partner, marketplaceProduct) violation from a concurrent
       * insert. Already-owned is exactly the state we want, so swallow. */
    }
  }
  /* Re-read so the returned set is complete regardless of which rows were
   * created here vs. already present (or inserted by a concurrent tab). */
  const rows = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      marketplaceProduct: {id: {in: productIds}},
    },
    select: {id: true},
  });
  return rows.map(row => row.id);
}

/** Maps distinct ISO currency codes to their Currency record ids. */
async function resolveCurrencyIds(
  client: Client,
  codes: string[],
): Promise<Map<string, string>> {
  const distinct = [...new Set(codes)];
  if (!distinct.length) return new Map();
  const currencies = await client.aOSCurrency.find({
    where: {codeISO: {in: distinct}},
    select: {codeISO: true},
  });
  return new Map(
    currencies
      .filter(currency => currency.codeISO)
      .map(currency => [currency.codeISO!, currency.id]),
  );
}

export async function attachOrderToPurchases(
  client: Client,
  partnerId: ID,
  productIds: string[],
  {invoiceId, saleOrderId}: {invoiceId: ID; saleOrderId: ID},
) {
  if (!productIds.length) return;
  const rows = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      marketplaceProduct: {id: {in: productIds}},
      invoice: {id: null},
    },
    select: {id: true, version: true},
  });
  for (const row of rows) {
    await client.aOSMarketplaceProductPurchase.update({
      data: {
        id: row.id,
        version: row.version,
        invoice: {select: {id: invoiceId}},
        saleOrder: {select: {id: saleOrderId}},
      },
      select: {id: true},
    });
  }
}

/* Determines if a user can download a product based on purchase state. */
export async function canDownloadProduct({
  client,
  productId,
  publisherId,
  mainPartnerId,
  paid,
}: {
  client: Client;
  productId: ID;
  publisherId: ID;
  mainPartnerId: ID | null | undefined;
  paid: boolean;
}): Promise<boolean> {
  if (!paid) return true;
  if (!mainPartnerId) return false;
  if (publisherId && mainPartnerId === publisherId) return true;
  const purchase = await client.aOSMarketplaceProductPurchase.findOne({
    where: {
      partner: {id: mainPartnerId},
      marketplaceProduct: {id: productId},
    },
    select: {id: true},
  });
  return !!purchase;
}
