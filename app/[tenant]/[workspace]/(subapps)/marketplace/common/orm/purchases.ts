import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProductPurchase} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {versionNumberFields, type QueryProps} from './helpers';

// ---- PURCHASES / OWNERSHIP ---- //

/* Marketplace ownership records. The unique (partner, product) constraint
 * on the AOS side makes `recordPurchases` and `attachInvoiceToPurchases`
 * idempotent — safe to retry from the success page or a backfill job.
 *
 * The `invoice` field is nullable: the goovee tx writes the access row
 * immediately, and the post-commit AOS HTTP call back-attaches the
 * invoice id once the SO/Invoice/InvoicePayment have been created. See
 * docs/marketplace-checkout-plan.md for the full rationale. */

export type MarketplacePurchase = Awaited<
  ReturnType<typeof findPurchases>
>[number];

export async function findPurchases({
  client,
  mainPartnerId,
  take,
  skip,
}: {
  client: Client;
  mainPartnerId: ID | null | undefined;
} & Pick<QueryProps<AOSMarketplaceProductPurchase>, 'take' | 'skip'>) {
  if (!mainPartnerId) return [];
  return client.aOSMarketplaceProductPurchase.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    where: {partner: {id: mainPartnerId}},
    orderBy: {purchasedAt: 'DESC'},
    select: {
      id: true,
      purchasedAt: true,
      product: {
        id: true,
        slug: true,
        name: true,
        description: true,
        marketplaceTypeSelect: true,
        marketplaceIconCode: true,
        marketplaceCoverStyle: true,
        currentVersion: {id: true, ...versionNumberFields},
      },
      invoice: {id: true, invoiceId: true},
    },
  });
}

export async function recordPurchases(
  client: Client,
  partnerId: ID,
  productIds: string[],
  invoiceId: ID | null = null,
) {
  if (!productIds.length) return;
  const existing = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      product: {id: {in: productIds}},
    },
    select: {product: {id: true}},
  });
  const existingIds = new Set(
    existing.map(row => row.product?.id).filter(Boolean) as string[],
  );
  const missing = productIds.filter(id => !existingIds.has(id));
  const now = new Date();
  for (const productId of missing) {
    try {
      await client.aOSMarketplaceProductPurchase.create({
        data: {
          partner: {select: {id: partnerId}},
          product: {select: {id: productId}},
          ...(invoiceId ? {invoice: {select: {id: String(invoiceId)}}} : {}),
          purchasedAt: now,
        },
        select: {id: true},
      });
    } catch {
      /* Unique (partner, product) violation from a concurrent insert.
       * Already-owned is exactly the state we want, so swallow. */
    }
  }
}

export async function attachInvoiceToPurchases(
  client: Client,
  partnerId: ID,
  productIds: string[],
  invoiceId: ID,
) {
  if (!productIds.length) return;
  const rows = await client.aOSMarketplaceProductPurchase.find({
    where: {
      partner: {id: partnerId},
      product: {id: {in: productIds}},
      invoice: {id: null},
    },
    select: {id: true, version: true},
  });
  for (const row of rows) {
    await client.aOSMarketplaceProductPurchase.update({
      data: {
        id: row.id,
        version: row.version,
        invoice: {select: {id: String(invoiceId)}},
      },
      select: {id: true},
    });
  }
}
