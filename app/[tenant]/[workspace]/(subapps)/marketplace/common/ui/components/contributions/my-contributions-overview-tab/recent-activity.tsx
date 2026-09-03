import {SUBAPP_CODES} from '@/constants';
import type {WorkspaceURLs} from '@/lib/core/url/workspace-urls';
import {t} from '@/locale/server';
import {Skeleton} from '@/ui/components/skeleton';
import {Link} from '@/ui/components/link';
import type {ActivityItem} from '../../../../orm';
import {ProductTab} from '../../../../constants/tabs';
import {PartnerAvatar} from '../../shared/partner-avatar';
import {TooltipDate} from '../../shared/tooltip-date';

const CARD = 'bg-white rounded-lg border border-ink-100 p-4 md:p-6';

const ACTIVITY_STYLE: Record<ActivityItem['kind'], {bgColor: string}> = {
  review: {bgColor: 'bg-palette-amber-light'},
  download: {bgColor: 'bg-palette-blue-light'},
  purchase: {bgColor: 'bg-mint-500/15'},
};

export async function RecentActivity({
  activity,
  url,
  tenantId,
}: {
  activity: Promise<ActivityItem[]>;
  url: WorkspaceURLs;
  tenantId: string;
}) {
  const items = await activity;

  return (
    <div className={`${CARD} space-y-4`}>
      <h3 className="text-xl font-semibold text-ink-900">
        {await t('Recent activity')}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-ink-500">{await t('No activity yet.')}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <ActivityRow
              key={index}
              item={item}
              url={url}
              tenantId={tenantId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function ActivityRow({
  item,
  url,
  tenantId,
}: {
  item: ActivityItem;
  url: WorkspaceURLs;
  tenantId: string;
}) {
  const action =
    item.kind === 'review'
      ? await t('left a {0}★ review on', String(item.rating ?? 0))
      : item.kind === 'download'
        ? await t('downloaded')
        : await t('purchased');

  const name =
    item.actor?.simpleFullName || item.actor?.name || (await t('Someone'));

  return (
    <div className="border-b border-ink-100 pb-4 last:border-0 last:pb-0 flex items-center gap-4">
      {item.actor ? (
        <PartnerAvatar
          partner={item.actor}
          tenantId={tenantId}
          size={28}
          fallbackClassName={ACTIVITY_STYLE[item.kind].bgColor}
        />
      ) : (
        <div
          className={`${ACTIVITY_STYLE[item.kind].bgColor} rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 font-semibold text-xs`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink-900">
          <span className="font-bold">{name}</span>
          <span className="text-ink-500"> {action} </span>
          <Link
            href={url.forRouter(
              `/${SUBAPP_CODES.marketplace}/products/${item.marketplaceProduct.slug}${
                item.kind === 'review' ? `?tab=${ProductTab.Reviews}` : ''
              }`,
            )}
            className="font-bold text-royal hover:underline">
            {item.marketplaceProduct.name}
          </Link>
        </div>
      </div>
      <TooltipDate
        date={item.at}
        displayType="relative"
        lowercase
        className="text-xs text-ink-500 flex-shrink-0"
      />
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className={`${CARD} space-y-4`}>
      <Skeleton className="h-7 w-40" />
      <div className="space-y-4">
        {Array.from({length: 4}).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-12 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
