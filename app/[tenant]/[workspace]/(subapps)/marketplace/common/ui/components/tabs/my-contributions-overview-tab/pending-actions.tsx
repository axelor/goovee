import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {Skeleton} from '@/ui/components/skeleton';
import Link from 'next/link';
import type {PendingActions as PendingActionsData} from '../../../../orm';
import {RECENT_REVIEW_WINDOW_DAYS} from '../../../../constants/review';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import {TooltipDate} from '../../primitives/tooltip-date';

const CARD = 'bg-card rounded-lg border border-border p-4 md:p-6';

export async function PendingActions({
  pending,
  workspaceURI,
}: {
  pending: Promise<PendingActionsData>;
  workspaceURI: string;
}) {
  const {versions, reviews} = await pending;

  const [heading, noPendingLabel, inReviewLabel, draftLabel] =
    await Promise.all([
      t('Pending actions'),
      t('Nothing needs your attention right now.'),
      t('In review'),
      t('Draft'),
    ]);

  const isEmpty = versions.length === 0 && reviews.length === 0;

  return (
    <div className={`${CARD} space-y-4`}>
      <h3 className="text-xl font-semibold text-foreground">{heading}</h3>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{noPendingLabel}</p>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => {
            const isReview =
              version.status === MARKETPLACE_VERSION_STATUS.IN_REVIEW;
            return (
              <div
                key={`version-${index}`}
                className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div
                    className={`${
                      isReview
                        ? 'bg-palette-amber-light'
                        : 'bg-palette-purple-light'
                    } rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0`}>
                    {isReview ? '⚠️' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {version.marketplaceProduct.name} {version.versionLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isReview ? inReviewLabel : draftLabel}
                      {version.at && (
                        <>
                          {' · '}
                          <TooltipDate
                            date={version.at}
                            displayType="relative"
                            lowercase
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {reviews.map((review, index) => (
            <div
              key={`review-${index}`}
              className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex gap-3">
                <div className="bg-palette-red-light rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
                  🔔
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {t('{0} new reviews on', String(review.count))}{' '}
                    <Link
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${review.marketplaceProduct.slug}`}
                      className="text-primary hover:underline">
                      {review.marketplaceProduct.name}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'Average {0}★ · last {1} days',
                      review.avg.toFixed(1),
                      String(RECENT_REVIEW_WINDOW_DAYS),
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PendingActionsSkeleton() {
  return (
    <div className={`${CARD} space-y-4`}>
      <Skeleton className="h-7 w-40" />
      <div className="space-y-3">
        {Array.from({length: 3}).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
