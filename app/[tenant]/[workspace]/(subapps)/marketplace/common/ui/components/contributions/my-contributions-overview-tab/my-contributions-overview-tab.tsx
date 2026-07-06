import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import {Suspense} from 'react';
import {
  getAvgRatingStat,
  getInstallsStat,
  getPendingActions,
  getRecentActivity,
  getRevenueSummary,
  getSalesStat,
} from '../../../../orm';
import type {Workspace} from '@/orm/workspace';
import type {MarketplaceConfig} from '../../../../orm/config';
import {Swipe} from '../../shared/swipe';
import {PendingActions, PendingActionsSkeleton} from './pending-actions';
import {RecentActivity, RecentActivitySkeleton} from './recent-activity';
import {RevenuePanel, RevenuePanelSkeleton} from './revenue-panel';
import {
  AvgRatingStatCard,
  InstallsStatCard,
  RevenueStatCard,
  SalesStatCard,
  StatCardInnerSkeleton,
} from './stats-cards';

interface OverviewTabProps {
  mainPartnerId: ID;
  client: Client;
  workspace: Workspace;
  config: MarketplaceConfig;
  workspaceURI: string;
  tenantId: string;
}

const PENDING_ACTIONS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 5;

/* Each query is kicked off here and its promise handed to an independently
 * Suspended section, so a slow query (revenue) never blocks the fast panels.
 * The revenue promise is shared by the stat card and the chart, so it runs
 * once. */
export function OverviewTab({
  mainPartnerId,
  client,
  workspace,
  config,
  workspaceURI,
  tenantId,
}: OverviewTabProps) {
  const ctx = {client, workspace, config, mainPartnerId};
  const sales = getSalesStat(ctx);
  const installs = getInstallsStat(ctx);
  const avgRating = getAvgRatingStat(ctx);
  const revenue = getRevenueSummary(ctx);
  const pending = getPendingActions({...ctx, take: PENDING_ACTIONS_LIMIT});
  const activity = getRecentActivity({...ctx, take: RECENT_ACTIVITY_LIMIT});

  return (
    <div className="space-y-6">
      {/* Each card Suspends on its own query, so they stream in independently
          (no boundary around the whole row). */}
      <Swipe
        className="!w-[284px] !h-[160px]"
        items={[
          <Suspense key="revenue" fallback={<StatCardInnerSkeleton />}>
            <RevenueStatCard revenue={revenue} />
          </Suspense>,
          <Suspense key="sales" fallback={<StatCardInnerSkeleton />}>
            <SalesStatCard sales={sales} />
          </Suspense>,
          <Suspense key="installs" fallback={<StatCardInnerSkeleton />}>
            <InstallsStatCard installs={installs} />
          </Suspense>,
          <Suspense key="avg-rating" fallback={<StatCardInnerSkeleton />}>
            <AvgRatingStatCard avgRating={avgRating} />
          </Suspense>,
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<RevenuePanelSkeleton />}>
          <RevenuePanel revenue={revenue} />
        </Suspense>

        <Suspense fallback={<PendingActionsSkeleton />}>
          <PendingActions pending={pending} workspaceURI={workspaceURI} />
        </Suspense>
      </div>

      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity
          activity={activity}
          workspaceURI={workspaceURI}
          tenantId={tenantId}
        />
      </Suspense>
    </div>
  );
}
