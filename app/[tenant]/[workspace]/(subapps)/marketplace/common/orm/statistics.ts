import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {
  AOSMarketplaceDownload,
  AOSMarketplaceProduct,
  AOSMarketplaceProductPurchase,
  AOSMarketplaceProductVersion,
  AOSMarketplaceReview,
  AOSPartner,
} from '@/goovee/.generated/models';
import type {Currency} from '@/product/orm';
import {dateInTimezone, getExchangeRate, round} from '@/product/pricing';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import type {Payload, SelectOptions} from '@goovee/orm';
import {format, startOfMonth, subMonths} from 'date-fns';
import {RECENT_REVIEW_WINDOW_DAYS} from '../constants/review';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {PortalWorkspaceWithConfig} from '../utils/auth-helper';
import {formatVersionNumber} from '../utils/version-number';
import {withMyProductAccessFilter, type QueryProps} from './helpers';
import {getPriceContext} from './price';

type ContributionQuery = {
  client: Client;
  workspace: PortalWorkspaceWithConfig;
  mainPartnerId: ID;
};

const notArchived = {OR: [{archived: false}, {archived: null}]};

/** Month-start boundaries for the stat cards: the cards report the **last full
 *  calendar month** (`[startLastMonth, startThisMonth)`) and compare it to the
 *  month before it (`[startMonthBefore, startLastMonth)`). */
function monthWindows() {
  const startThisMonth = startOfMonth(new Date());
  const startLastMonth = subMonths(startThisMonth, 1);
  const startMonthBefore = subMonths(startThisMonth, 2);
  return {startThisMonth, startLastMonth, startMonthBefore};
}

/** Percentage change current-vs-previous, or null when there is no baseline
 *  to compare against (avoids a misleading "+100%" from a zero base). */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** The two months every stat card reports against (ISO 'YYYY-MM-01'); the UI
 *  formats them. Shared by each card's result so it can render the labels
 *  without depending on the other cards. */
type StatMonths = {
  /** The month the figure covers (the last full calendar month). */
  month: string;
  /** The month the trend compares against (the month before `month`). */
  previousMonth: string;
};

export type SalesStat = StatMonths & {
  sales: number;
  salesDeltaPct: number | null;
};

export type InstallsStat = StatMonths & {
  installs: number;
  installsDeltaPct: number | null;
};

export type AvgRatingStat = StatMonths & {
  avgRating: number;
  avgRatingDelta: number | null;
};

/** The listing filter, month windows, and ISO month labels every stat card
 *  shares. Pure (no query): each card builds this then runs only its own
 *  aggregates, so the cards stay independent and can stream separately. */
function statContext({workspace, mainPartnerId}: ContributionQuery) {
  // Filter over all the contributor's listings, nested under
  // `{marketplaceProduct: …}` on the child entities each card counts.
  const myProductsFilter = withMyProductAccessFilter(
    workspace,
    mainPartnerId,
  )();
  const {startThisMonth, startLastMonth, startMonthBefore} = monthWindows();
  return {
    myProductsFilter,
    lastMonth: {ge: startLastMonth, lt: startThisMonth},
    monthBefore: {ge: startMonthBefore, lt: startLastMonth},
    month: `${monthKey(startLastMonth)}-01`,
    previousMonth: `${monthKey(startMonthBefore)}-01`,
  };
}

/** Sales card — purchase rows across all the contributor's listings for the
 *  last full calendar month, with the change vs the month before. */
export async function getSalesStat(
  query: ContributionQuery,
): Promise<SalesStat> {
  const {client} = query;
  const {myProductsFilter, lastMonth, monthBefore, month, previousMonth} =
    statContext(query);

  const [last, before] = await Promise.all([
    client.aOSMarketplaceProductPurchase.count({
      where: and<AOSMarketplaceProductPurchase>([
        notArchived,
        {marketplaceProduct: myProductsFilter},
        {purchaseDateTime: lastMonth},
      ]),
    }),
    client.aOSMarketplaceProductPurchase.count({
      where: and<AOSMarketplaceProductPurchase>([
        notArchived,
        {marketplaceProduct: myProductsFilter},
        {purchaseDateTime: monthBefore},
      ]),
    }),
  ]);

  return {
    sales: Number(last),
    salesDeltaPct: pctChange(Number(last), Number(before)),
    month,
    previousMonth,
  };
}

/** Installs card — dated download rows across all the contributor's listings
 *  for the last full calendar month, with the change vs the month before. */
export async function getInstallsStat(
  query: ContributionQuery,
): Promise<InstallsStat> {
  const {client} = query;
  const {myProductsFilter, lastMonth, monthBefore, month, previousMonth} =
    statContext(query);

  const [last, before] = await Promise.all([
    client.aOSMarketplaceDownload.count({
      where: and<AOSMarketplaceDownload>([
        {marketplaceProduct: myProductsFilter},
        {createdOn: lastMonth},
      ]),
    }),
    client.aOSMarketplaceDownload.count({
      where: and<AOSMarketplaceDownload>([
        {marketplaceProduct: myProductsFilter},
        {createdOn: monthBefore},
      ]),
    }),
  ]);

  return {
    installs: Number(last),
    installsDeltaPct: pctChange(Number(last), Number(before)),
    month,
    previousMonth,
  };
}

/** Avg. rating card — mean review rating on the contributor's listings for the
 *  last full calendar month, with the change vs the month before. */
export async function getAvgRatingStat(
  query: ContributionQuery,
): Promise<AvgRatingStat> {
  const {client} = query;
  const {myProductsFilter, lastMonth, monthBefore, month, previousMonth} =
    statContext(query);

  const [lastAgg, beforeAgg] = await Promise.all([
    client.aOSMarketplaceReview.aggregate({
      avg: {rating: true},
      where: and<AOSMarketplaceReview>([
        notArchived,
        {marketplaceProduct: myProductsFilter},
        {createdOn: lastMonth},
      ]),
    }),
    client.aOSMarketplaceReview.aggregate({
      avg: {rating: true},
      where: and<AOSMarketplaceReview>([
        notArchived,
        {marketplaceProduct: myProductsFilter},
        {createdOn: monthBefore},
      ]),
    }),
  ]);

  const ratingLast = lastAgg[0]?.avg?.rating;
  const ratingBefore = beforeAgg[0]?.avg?.rating;
  const avgRatingDelta =
    ratingLast != null && ratingBefore != null
      ? Number(ratingLast) - Number(ratingBefore)
      : null;

  return {
    avgRating:
      ratingLast != null ? Math.round(Number(ratingLast) * 10) / 10 : 0,
    avgRatingDelta:
      avgRatingDelta != null ? Math.round(avgRatingDelta * 10) / 10 : null,
    month,
    previousMonth,
  };
}

/** The only statuses `getPendingActions` surfaces (it filters on these). */
export type PendingVersionStatus =
  | MARKETPLACE_VERSION_STATUS.IN_REVIEW
  | MARKETPLACE_VERSION_STATUS.DRAFT;

/* Listing fields kept on each pending item, nested as the ORM returns them so
 * adding a field is just a `select` change (no new top-level keys). */
const pendingVersionProductSelect = {
  name: true,
} as const satisfies SelectOptions<AOSMarketplaceProduct>;
const pendingReviewProductSelect = {
  name: true,
  slug: true,
} as const satisfies SelectOptions<AOSMarketplaceProduct>;

export type PendingVersion = {
  marketplaceProduct: Payload<
    AOSMarketplaceProduct,
    {select: typeof pendingVersionProductSelect}
  >;
  versionLabel: string;
  status: PendingVersionStatus;
  at: Date | null;
};

export type PendingReviews = {
  marketplaceProduct: Payload<
    AOSMarketplaceProduct,
    {select: typeof pendingReviewProductSelect}
  >;
  count: number;
  avg: number;
  at: Date | null;
};

export type PendingActions = {
  versions: PendingVersion[];
  reviews: PendingReviews[];
};

/** Things waiting on the contributor: versions still in review or sitting as a
 *  draft, plus a roll-up of reviews left on their listings in the last week.
 *  `take` caps the total number of items returned (versions first). */
export async function getPendingActions({
  client,
  workspace,
  mainPartnerId,
  take,
}: ContributionQuery &
  Pick<
    QueryProps<AOSMarketplaceProductVersion>,
    'take'
  >): Promise<PendingActions> {
  const mine = withMyProductAccessFilter(workspace, mainPartnerId)();
  const since = new Date(
    Date.now() - RECENT_REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const [versions, recentReviews] = await Promise.all([
    client.aOSMarketplaceProductVersion.find({
      where: and<AOSMarketplaceProductVersion>([
        notArchived,
        {
          statusSelect: {
            in: [
              MARKETPLACE_VERSION_STATUS.IN_REVIEW,
              MARKETPLACE_VERSION_STATUS.DRAFT,
            ],
          },
        },
        {marketplaceProduct: mine},
      ]),
      orderBy: {updatedOn: 'DESC'},
      ...(take ? {take} : {}),
      select: {
        statusSelect: true,
        updatedOn: true,
        vMajor: true,
        vMinor: true,
        vPatch: true,
        vPreRelease: true,
        marketplaceProduct: pendingVersionProductSelect,
      },
    }),
    client.aOSMarketplaceReview.find({
      where: and<AOSMarketplaceReview>([
        notArchived,
        {marketplaceProduct: mine},
        {createdOn: {ge: since}},
      ]),
      orderBy: {createdOn: 'DESC'},
      select: {
        rating: true,
        createdOn: true,
        marketplaceProduct: pendingReviewProductSelect,
      },
    }),
  ]);

  // Roll the recent reviews up per product: count + average + newest timestamp.
  const byProduct = new Map<
    string,
    {
      marketplaceProduct: PendingReviews['marketplaceProduct'];
      count: number;
      sum: number;
      at: Date | null;
    }
  >();
  for (const review of recentReviews) {
    const productId = review.marketplaceProduct.id;
    const entry = byProduct.get(productId) ?? {
      marketplaceProduct: review.marketplaceProduct,
      count: 0,
      sum: 0,
      at: null,
    };
    entry.count += 1;
    entry.sum += review.rating ?? 0;
    if (review.createdOn && (!entry.at || review.createdOn > entry.at))
      entry.at = review.createdOn;
    byProduct.set(productId, entry);
  }

  const mappedVersions: PendingVersion[] = versions.map(version => ({
    marketplaceProduct: version.marketplaceProduct,
    versionLabel: formatVersionNumber({
      vMajor: version.vMajor ?? 0,
      vMinor: version.vMinor ?? null,
      vPatch: version.vPatch ?? null,
      vPreRelease: version.vPreRelease ?? null,
    }),
    // The query filters statusSelect to exactly these two values.
    status:
      (version.statusSelect as PendingVersionStatus) ??
      MARKETPLACE_VERSION_STATUS.DRAFT,
    at: version.updatedOn ?? null,
  }));

  // Cap the panel to `take` items total, versions first.
  const mappedReviews: PendingReviews[] = [...byProduct.values()].map(
    rollup => ({
      marketplaceProduct: rollup.marketplaceProduct,
      count: rollup.count,
      avg: Math.round((rollup.sum / rollup.count) * 10) / 10,
      at: rollup.at,
    }),
  );

  return {
    versions: take ? mappedVersions.slice(0, take) : mappedVersions,
    reviews: take
      ? mappedReviews.slice(0, Math.max(0, take - mappedVersions.length))
      : mappedReviews,
  };
}

export type ActivityKind = 'review' | 'download' | 'purchase';

/* Listing + actor fields kept on each activity row, nested as the ORM returns
 * them (shared by all three sources). */
const activityProductSelect = {
  name: true,
  slug: true,
} as const satisfies SelectOptions<AOSMarketplaceProduct>;
const activityActorSelect = {
  simpleFullName: true,
  name: true,
  picture: {id: true},
} as const satisfies SelectOptions<AOSPartner>;

export type ActivityItem = {
  kind: ActivityKind;
  /** The reviewer (`author`) or buyer/downloader (`partner`), as the ORM
   *  returns it; null when the source row has no partner. */
  actor: Payload<AOSPartner, {select: typeof activityActorSelect}> | null;
  marketplaceProduct: Payload<
    AOSMarketplaceProduct,
    {select: typeof activityProductSelect}
  >;
  rating?: number;
  at: Date;
};

/** A merged, newest-first feed of reviews, downloads and purchases across the
 *  contributor's listings. Each source is ordered in the database; only the
 *  cross-source merge is sorted in memory. */
export async function getRecentActivity({
  client,
  workspace,
  mainPartnerId,
  take,
}: ContributionQuery & Pick<QueryProps<AOSMarketplaceReview>, 'take'>): Promise<
  ActivityItem[]
> {
  const mine = withMyProductAccessFilter(workspace, mainPartnerId)();

  const [reviews, downloads, purchases] = await Promise.all([
    client.aOSMarketplaceReview.find({
      where: and<AOSMarketplaceReview>([
        notArchived,
        {marketplaceProduct: mine},
      ]),
      orderBy: {createdOn: 'DESC'},
      ...(take ? {take} : {}),
      select: {
        rating: true,
        createdOn: true,
        author: activityActorSelect,
        marketplaceProduct: activityProductSelect,
      },
    }),
    client.aOSMarketplaceDownload.find({
      where: {marketplaceProduct: mine},
      orderBy: {createdOn: 'DESC'},
      ...(take ? {take} : {}),
      select: {
        createdOn: true,
        partner: activityActorSelect,
        marketplaceProduct: activityProductSelect,
      },
    }),
    client.aOSMarketplaceProductPurchase.find({
      where: and<AOSMarketplaceProductPurchase>([
        notArchived,
        {marketplaceProduct: mine},
      ]),
      orderBy: {purchaseDateTime: 'DESC'},
      ...(take ? {take} : {}),
      select: {
        purchaseDateTime: true,
        partner: activityActorSelect,
        marketplaceProduct: activityProductSelect,
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...reviews
      .filter(review => review.createdOn)
      .map(review => ({
        kind: 'review' as const,
        actor: review.author,
        marketplaceProduct: review.marketplaceProduct,
        rating: review.rating ?? undefined,
        at: review.createdOn!,
      })),
    ...downloads
      .filter(download => download.createdOn)
      .map(download => ({
        kind: 'download' as const,
        actor: download.partner,
        marketplaceProduct: download.marketplaceProduct,
        at: download.createdOn!,
      })),
    ...purchases.map(purchase => ({
      kind: 'purchase' as const,
      actor: purchase.partner,
      marketplaceProduct: purchase.marketplaceProduct,
      at: purchase.purchaseDateTime,
    })),
  ];

  const sorted = items.sort(
    (left, right) => right.at.getTime() - left.at.getTime(),
  );
  return take ? sorted.slice(0, take) : sorted;
}

const REVENUE_MONTHS = 12;

export type RevenueMonth = {
  /** Month start as an ISO date ('YYYY-MM-01'); the UI formats it
   *  locale-aware (e.g. "Jan") rather than baking an English label here. */
  month: string;
  revenue: number;
};

export type RevenueSummary = {
  /** Contributor's currency that `lastMonth`/`monthly` are expressed in (the
   *  ORM payload), or null when there are no purchases / no usable currency. */
  currency: Currency | null;
  /** Net revenue for the last full calendar month (the stat-card headline). */
  lastMonth: number;
  /** Last-full-month vs the month before it, or null with no baseline. */
  deltaPct: number | null;
  /** Trailing 12 calendar months, oldest first (the chart). */
  monthly: RevenueMonth[];
  /** The month `lastMonth` covers (ISO 'YYYY-MM-01'); the UI formats it. */
  month: string;
  /** The month the trend compares against (the month before `month`). */
  previousMonth: string;
  /** Purchases skipped for lack of an exchange rate to the contributor's
   *  currency — surfaced so the totals aren't silently under-reported. */
  unconvertible: number;
};

/** 'yyyy-MM' bucket key for a date (local time). */
function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** The trailing `REVENUE_MONTHS` months, oldest first: bucket key + ISO date. */
function revenueMonths(): {key: string; iso: string}[] {
  const startThisMonth = startOfMonth(new Date());
  return Array.from({length: REVENUE_MONTHS}, (_, offset) => {
    const key = monthKey(
      subMonths(startThisMonth, REVENUE_MONTHS - 1 - offset),
    );
    return {key, iso: `${key}-01`};
  });
}

/** Net revenue (price W.T.) across the contributor's listings, converted to
 *  their own currency at each purchase's date: the last full month (headline),
 *  its change vs the month before, and a trailing 12-month series for the
 *  chart. The fetch is bounded to the charted window. */
export async function getRevenueSummary({
  client,
  workspace,
  mainPartnerId,
}: ContributionQuery): Promise<RevenueSummary> {
  const months = revenueMonths();
  const emptySeries = months.map(month => ({month: month.iso, revenue: 0}));
  // The headline month (last full month) and the month the trend compares to.
  const reportedMonth = months[months.length - 2].iso;
  const previousMonth = months[months.length - 3].iso;

  // Lower-bound the fetch to the start of the charted window (no lifetime
  // total is needed, so we never load the contributor's full sales history).
  const [windowYear, windowMonth] = months[0].key.split('-').map(Number);
  const windowStart = new Date(windowYear, windowMonth - 1, 1);

  const purchases = await client.aOSMarketplaceProductPurchase.find({
    where: and<AOSMarketplaceProductPurchase>([
      notArchived,
      {
        marketplaceProduct: withMyProductAccessFilter(
          workspace,
          mainPartnerId,
        )(),
      },
      {purchaseDateTime: {ge: windowStart}},
    ]),
    orderBy: {purchaseDateTime: 'DESC'},
    select: {
      purchaseDateTime: true,
      priceWt: true,
      currency: {codeISO: true},
    },
  });

  if (!purchases.length) {
    return {
      currency: null,
      lastMonth: 0,
      deltaPct: null,
      monthly: emptySeries,
      month: reportedMonth,
      previousMonth,
      unconvertible: 0,
    };
  }

  // The contributor's currency (+ conversion lines covering every charged
  // currency) is the conversion target.
  const priceContext = await getPriceContext({
    client,
    mainPartnerId,
    productCurrencyCodes: purchases.map(purchase => purchase.currency?.codeISO),
  });
  const target = priceContext.viewerCurrency ?? priceContext.defaultCurrency;
  if (!target?.codeISO) {
    return {
      currency: null,
      lastMonth: 0,
      deltaPct: null,
      monthly: emptySeries,
      month: reportedMonth,
      previousMonth,
      unconvertible: purchases.length,
    };
  }
  const targetCode = target.codeISO;
  const decimals = target.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;
  const companyTimezone = workspace.config.company?.timezone;

  let unconvertible = 0;
  const byMonth = new Map<string, number>();
  for (const purchase of purchases) {
    const fromCode = purchase.currency?.codeISO;
    if (!fromCode) {
      unconvertible += 1;
      continue;
    }
    /* Convert at the sale date in the company timezone — the same as-of date
     * the checkout used (todayInTimezone), so the buyer→contributor rate is
     * the inverse of the rate the buyer was charged at. */
    const asOf = dateInTimezone(purchase.purchaseDateTime, companyTimezone);
    let rate: number;
    try {
      rate = getExchangeRate(
        fromCode,
        targetCode,
        asOf,
        priceContext.conversionLines,
      );
    } catch {
      unconvertible += 1;
      continue;
    }
    const value = round(Number(purchase.priceWt) * rate, decimals);
    const key = monthKey(purchase.purchaseDateTime);
    byMonth.set(key, (byMonth.get(key) ?? 0) + value);
  }

  // Headline = last full month (the bucket before the current, in-progress
  // month); delta compares it to the month before that.
  const lastMonth = byMonth.get(months[months.length - 2].key) ?? 0;
  const monthBefore = byMonth.get(months[months.length - 3].key) ?? 0;

  return {
    currency: target,
    lastMonth: round(lastMonth, decimals),
    deltaPct: pctChange(lastMonth, monthBefore),
    monthly: months.map(month => ({
      month: month.iso,
      revenue: round(byMonth.get(month.key) ?? 0, decimals),
    })),
    month: reportedMonth,
    previousMonth,
    unconvertible,
  };
}
