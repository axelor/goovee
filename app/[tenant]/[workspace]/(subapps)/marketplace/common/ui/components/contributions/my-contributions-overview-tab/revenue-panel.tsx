import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import {t} from '@/locale/server';
import {Skeleton} from '@/ui/components/skeleton';
import type {RevenueSummary} from '../../../../orm';
import {RevenueChart} from './revenue-chart';

const CARD =
  'lg:col-span-2 bg-white rounded-lg border border-ink-100 p-4 md:p-6';

export async function RevenuePanel({
  revenue,
}: {
  revenue: Promise<RevenueSummary>;
}) {
  const {currency, monthly} = await revenue;

  return (
    <div className={`${CARD} space-y-4`}>
      <h3 className="text-xl font-semibold text-ink-900">
        {await t('Revenue · last 12 months')}
      </h3>
      {currency?.codeISO ? (
        <RevenueChart
          data={monthly}
          label={await t('Revenue')}
          currencyCode={currency.codeISO}
          currencyScale={currency.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE}
        />
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-ink-500">{await t('No sales yet.')}</p>
        </div>
      )}
    </div>
  );
}

export function RevenuePanelSkeleton() {
  return (
    <div className={`${CARD} space-y-4`}>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
