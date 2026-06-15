import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import {t} from '@/locale/server';
import {formatDate, formatNumber} from '@/locale/server/formatters';
import {Skeleton} from '@/ui/components/skeleton';
import {ArrowRight, TrendingDown, TrendingUp} from 'lucide-react';
import type {
  AvgRatingStat,
  InstallsStat,
  RevenueSummary,
  SalesStat,
} from '../../../../orm';

/** Formats a signed percentage to one decimal: 15.83 -> "+15.8%",
 *  -3.2 -> "-3.2%", 0 -> "0%" (no leading sign on zero). */
function formatPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

/** Formats a signed rating delta: 0.1 -> "+0.1", 0 -> "0". */
function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}

/** Formats a money amount in the contributor's currency via the shared locale
 *  formatter (Intl currency style), or "—" when there is no currency. */
async function formatMoney(
  amount: number,
  currency: RevenueSummary['currency'],
): Promise<string> {
  if (!currency?.codeISO) return '—';
  return String(
    await formatNumber(amount, {
      type: 'DECIMAL',
      scale: currency.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE,
      // ISO code (machine identity) — required by the Intl currency style.
      currency: currency.codeISO,
    }),
  );
}

/** Formats the server-supplied month boundaries into the card's month label
 *  (the abbreviated month, e.g. "May") and the "vs <month>" trend suffix
 *  (e.g. "vs Apr"). */
async function monthLabels(month: string, previousMonth: string) {
  const [monthLabel, previousName] = await Promise.all([
    formatDate(month, {dateFormat: 'MMM'}),
    formatDate(previousMonth, {dateFormat: 'MMM'}),
  ]);
  return {monthLabel, vsLabel: await t('vs {0}', previousName)};
}

type StatCardProps = {
  label: string;
  value: string;
  /** Abbreviated month the value covers, e.g. "May" (shown in parentheses). */
  monthLabel: string;
  delta: number | null;
  /** Formatted delta (e.g. "+15.8%"), or null when there is no prior month. */
  deltaText: string | null;
  /** Trend suffix naming the compared month, e.g. "vs Apr". */
  vsLabel: string;
  baselineLabel: string;
  icon: string;
  bgColor: string;
};

/** One stat card's inner content (the Swipe slide supplies the card chrome). */
function StatCard({
  label,
  value,
  monthLabel,
  delta,
  deltaText,
  vsLabel,
  baselineLabel,
  icon,
  bgColor,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`${bgColor} rounded-lg p-2`}>{icon}</div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">
          {value}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({monthLabel})
          </span>
        </div>
        {/* Trend row is always shown (icon + text). With no earlier month to
            compare, it reads as the baseline rather than a change. */}
        <span
          className={`inline-flex items-center gap-0.5 text-xs ${
            deltaText && (delta ?? 0) < 0
              ? 'text-destructive'
              : 'text-success-dark'
          }`}>
          {!deltaText || delta === 0 ? (
            <ArrowRight className="h-3 w-3" />
          ) : (delta ?? 0) > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {deltaText ? `${deltaText} ${vsLabel}` : baselineLabel}
        </span>
      </div>
    </div>
  );
}

export function StatCardInnerSkeleton() {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

/* Each card awaits only its own query and computes its own month labels, so it
 * streams into its Swipe slide independently — the fastest card appears first
 * rather than all four waiting on the slowest. The overview tab assembles them
 * into the Swipe, each behind its own Suspense. */

export async function RevenueStatCard({
  revenue,
}: {
  revenue: Promise<RevenueSummary>;
}) {
  const {lastMonth, currency, deltaPct, month, previousMonth} = await revenue;
  const {monthLabel, vsLabel} = await monthLabels(month, previousMonth);
  return (
    <StatCard
      label={await t('Revenue')}
      value={await formatMoney(lastMonth, currency)}
      monthLabel={monthLabel}
      delta={deltaPct}
      deltaText={deltaPct != null ? formatPct(deltaPct) : null}
      vsLabel={vsLabel}
      baselineLabel={await t('Baseline')}
      icon="💰"
      bgColor="bg-success/15"
    />
  );
}

export async function SalesStatCard({sales}: {sales: Promise<SalesStat>}) {
  const {sales: value, salesDeltaPct, month, previousMonth} = await sales;
  const {monthLabel, vsLabel} = await monthLabels(month, previousMonth);
  return (
    <StatCard
      label={await t('Sales')}
      value={value.toLocaleString()}
      monthLabel={monthLabel}
      delta={salesDeltaPct}
      deltaText={salesDeltaPct != null ? formatPct(salesDeltaPct) : null}
      vsLabel={vsLabel}
      baselineLabel={await t('Baseline')}
      icon="🛍️"
      bgColor="bg-palette-amber-light"
    />
  );
}

export async function InstallsStatCard({
  installs,
}: {
  installs: Promise<InstallsStat>;
}) {
  const {
    installs: value,
    installsDeltaPct,
    month,
    previousMonth,
  } = await installs;
  const {monthLabel, vsLabel} = await monthLabels(month, previousMonth);
  return (
    <StatCard
      label={await t('Installs')}
      value={value.toLocaleString()}
      monthLabel={monthLabel}
      delta={installsDeltaPct}
      deltaText={installsDeltaPct != null ? formatPct(installsDeltaPct) : null}
      vsLabel={vsLabel}
      baselineLabel={await t('Baseline')}
      icon="📥"
      bgColor="bg-palette-blue-light"
    />
  );
}

export async function AvgRatingStatCard({
  avgRating,
}: {
  avgRating: Promise<AvgRatingStat>;
}) {
  const {
    avgRating: value,
    avgRatingDelta,
    month,
    previousMonth,
  } = await avgRating;
  const {monthLabel, vsLabel} = await monthLabels(month, previousMonth);
  return (
    <StatCard
      label={await t('Avg. rating')}
      value={value ? value.toFixed(1) : '—'}
      monthLabel={monthLabel}
      delta={avgRatingDelta}
      deltaText={avgRatingDelta != null ? formatDelta(avgRatingDelta) : null}
      vsLabel={vsLabel}
      baselineLabel={await t('Baseline')}
      icon="⭐"
      bgColor="bg-palette-pink-light"
    />
  );
}
