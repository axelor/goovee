'use client';

import {MdChevronRight} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  BadgeList,
  InnerHTML,
} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {formatDateTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {
  EventCardProps,
  ListEvent,
} from '@/subapps/events/common/ui/components/events/types';
import styles from './event-card.module.scss';
import mainStyles from '@/subapps/events/styles.module.scss';
import {Skeleton} from '@/ui/components/skeleton';
import Image from 'next/image';

function getListEventImageURL({
  event,
  workspaceURI,
}: {
  event: ListEvent;
  workspaceURI: string;
}) {
  const categoryWithImage = event.eventCategorySet?.find(
    cat => cat.thumbnailImage?.id || cat.image?.id,
  );
  if (categoryWithImage) {
    return withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.events}/api/category/${categoryWithImage.id}/image/${categoryWithImage.thumbnailImage?.id || categoryWithImage.image?.id}`,
    );
  }
  if (event.eventImage?.id) {
    return withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${event.slug}/image`,
    );
  }
  return withBasePath(NO_IMAGE_URL);
}

export const EventCard = ({event}: EventCardProps) => {
  const {workspaceURI} = useWorkspace();

  const stripImages = (htmlContent: string = '') =>
    htmlContent?.replace(/<img[^>]*>/g, '');

  return (
    <Card className="p-4 overflow-hidden cursor-pointer rounded-xl flex gap-5 h-fit border border-ink-100 shadow-xs hover:shadow-soft-md transition-shadow bg-white">
      <div className="w-[140px] h-[140px] rounded-lg flex-shrink-0 relative bg-ink-50 overflow-hidden">
        <Image
          height={140}
          width={140}
          alt="Event image"
          className="rounded-lg w-[140px] h-[140px] object-cover"
          src={getListEventImageURL({event, workspaceURI})}
        />
      </div>

      <div className="flex w-full gap-6 py-1">
        <div
          className={`flex flex-col flex-1 gap-2 ${styles['event-details-container']}`}>
          <CardHeader className="w-full p-0 gap-1">
            <CardTitle className="flex items-start justify-between gap-3 w-full">
              <p className="text-base font-bold text-ink-900 leading-snug line-clamp-2">
                {event.eventTitle}
              </p>
              {event?.isRegistered && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold py-0.5 px-2 text-mint-700 border-mint-200 bg-mint-50 h-fit flex-none">
                  {i18n.t('#Registered')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-ink-500 tabular-nums">
              {`${event.eventStartDateTime ? formatDateTime(event.eventStartDateTime, {dateFormat: 'MMMM D YYYY - ', timeFormat: 'h:mmA'}) : ''}
            ${event.eventEndDateTime && !event.eventAllDay ? i18n.t('to') : ''}
             ${
               event.eventEndDateTime && !event.eventAllDay
                 ? formatDateTime(event.eventEndDateTime, {
                     dateFormat: 'MMMM D YYYY - ',
                     timeFormat: 'h:mmA',
                   })
                 : ''
             }
              `}
            </CardDescription>
            <BadgeList items={event.eventCategorySet} />
          </CardHeader>
          <CardContent className="p-0">
            <InnerHTML
              className={`text-sm w-full font-normal line-clamp-2 text-ink-500 overflow-hidden ${mainStyles['constrained-content']} prose`}
              content={
                event?.eventDescription
                  ? stripImages(event.eventDescription)
                  : ''
              }
            />
          </CardContent>
        </div>
        <div className="flex-col hidden lg:flex items-center justify-center pr-1">
          <Button
            className="bg-royal-pale hover:bg-royal text-royal hover:text-white h-10 w-10 p-0 rounded-lg transition-colors"
            aria-label={i18n.t('Open event')}>
            <MdChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export function EventCardSkeleton() {
  return (
    <Card className="p-2 overflow-hidden cursor-pointer rounded-2xl flex gap-6 h-fit border-none shadow-none ">
      {/* Image skeleton */}
      <Skeleton className="w-[150px] h-[150px] rounded-lg flex-shrink-0" />

      <div className="flex w-full gap-10 py-2">
        <div className="flex flex-col flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-1/2" />

          {/* Date & time */}
          <Skeleton className="h-4 w-3/4" />

          {/* Tag */}
          <Skeleton className="h-5 w-16 rounded-2xl" />

          {/* Description */}
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Arrow button */}
        <div className="hidden lg:flex items-center justify-center pr-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
