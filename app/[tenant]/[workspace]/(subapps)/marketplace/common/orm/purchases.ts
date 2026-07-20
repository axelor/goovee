import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceProductPurchase} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {BigDecimal} from '@goovee/orm';
import {versionNumberFields, type QueryProps} from './helpers';

/** Price captured at checkout, persisted on each purchase line. */
export type PurchasePriceInput = {
  productId: string;
  priceWt: number;
  priceAti: number;
  taxRate: number;
};

// ---- ORDERS / PURCHASES / OWNERSHIP ---- //

/* A marketplace order groups a checkout's purchase (access) lines and owns the context needed to
 * build the SaleOrder + Invoice. goovee writes the header + lines in the grant transaction; the
 * order/invoice is then created on the AOS side (at checkout via after(), or by admin recovery) and
 * linked onto the header — never read back here. The buyer's listings reach the order/invoice via
 * each line's `productOrder`. The unique (owner, marketplaceProduct) constraint keeps ownership
 * one row per product: a concurrent re-checkout of an owned product collides on it and rolls back
 * the whole create, so the buyer is never granted the same product twice. */

export type MarketplacePurchase = Awaited<
  ReturnType<typeof findPurchases>
>[number];

export async function findPurchases({
  client,
  workspaceId,
  mainPartnerId,
  take,
  skip,
  orderId,
}: {
  client: Client;
  /** Listings are scoped to a single workspace, so purchases of products in
   *  another workspace of the same tenant must not surface here. */
  workspaceId: ID;
  mainPartnerId: ID;
  /** When provided, restricts the result to one order's lines (still
   *  owner-scoped, so it's safe against a tampered order id). */
  orderId?: string;
} & Pick<QueryProps<AOSMarketplaceProductPurchase>, 'take' | 'skip'>) {
  return client.aOSMarketplaceProductPurchase.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    where: {
      OR: [{archived: false}, {archived: null}],
      owner: {id: mainPartnerId},
      marketplaceProduct: {portalWorkspace: {id: workspaceId}},
      ...(orderId ? {productOrder: {id: orderId}} : {}),
    },
    orderBy: {purchaseDateTime: 'DESC'},
    select: {
      id: true,
      purchaseDateTime: true,
      marketplaceProduct: {
        id: true,
        slug: true,
        name: true,
        description: true,
        marketplaceTypeSelect: true,
        moderationStatusSelect: true,
        moderationReason: true,
        iconCode: true,
        coverStyle: true,
        currentVersion: {id: true, ...versionNumberFields},
      },
      /* The order/invoice live on the order header; reach them through the line's order. */
      productOrder: {
        saleOrder: {id: true, saleOrderSeq: true},
        invoice: {id: true, invoiceId: true},
      },
    },
  });
}

/* Creates the marketplace order header and a purchase (access) line per cart item, returning the
 * order id. The caller hands the resolved order context; this function owns how each piece is
 * stored — e.g. it takes the invoicing address and derives both the stored address id and its
 * frozen formatted text. `ordererId` is the logged-in user (the order's `orderedBy`); `ownerId` is
 * the owning main partner set as each line's `owner` (the ownership/access key). The context fields are
 * nullable because a missing value (e.g. no invoicing address) is itself a recoverable failure
 * cause; `paymentContextId` is stored as the id string (PaymentContext is goovee-owned). */
export async function recordOrder({
  client,
  ordererId,
  ownerId,
  items,
  currencyCodeISO,
  paidAmount,
  companyId,
  paymentModeId,
  invoicingAddress,
  paymentContextId,
}: {
  client: Client;
  ordererId: ID;
  ownerId: ID;
  items: PurchasePriceInput[];
  /** ISO 4217 code of the cart's single charged currency, shared by the order and every line. */
  currencyCodeISO: string;
  /** Total the buyer was charged at checkout, in that currency. */
  paidAmount: number;
  companyId: ID | null;
  paymentModeId: ID | null;
  invoicingAddress: {id: ID; formattedFullName: string | null} | null;
  paymentContextId: ID | null;
}): Promise<string> {
  /* The cart is validated single-currency at checkout. Link the Currency FK by its ISO code on the
   * order and every line — the code came from pricing a product, so it always matches a record. */
  const now = new Date();
  const lines = items.map(item => ({
    owner: {select: {id: ownerId}},
    marketplaceProduct: {select: {id: item.productId}},
    purchaseDateTime: now,
    priceWt: new BigDecimal(String(item.priceWt)),
    priceAti: new BigDecimal(String(item.priceAti)),
    taxRate: new BigDecimal(String(item.taxRate)),
    currency: {select: {codeISO: currencyCodeISO}},
  }));

  const order = await client.aOSMarketplaceProductOrder.create({
    data: {
      orderedBy: {select: {id: ordererId}},
      currency: {select: {codeISO: currencyCodeISO}},
      paidAmount: new BigDecimal(String(paidAmount)),
      ...(companyId && {company: {select: {id: companyId}}}),
      ...(paymentModeId && {paymentMode: {select: {id: paymentModeId}}}),
      ...(invoicingAddress && {
        invoicingAddress: {select: {id: invoicingAddress.id}},
        ...(invoicingAddress.formattedFullName && {
          invoicingAddressStr: invoicingAddress.formattedFullName,
        }),
      }),
      ...(paymentContextId && {paymentContextId}),
      purchaseList: {create: lines},
    },
    select: {id: true},
  });

  return order.id;
}

/* Determines if a user can download a product based on ownership (the access key on the line). */
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
      owner: {id: mainPartnerId},
      marketplaceProduct: {id: productId},
    },
    select: {id: true},
  });
  return !!purchase;
}
