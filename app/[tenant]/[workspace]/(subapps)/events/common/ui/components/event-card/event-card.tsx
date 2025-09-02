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
    return `${workspaceURI}/${SUBAPP_CODES.events}/api/category/${categoryWithImage.id}/image/${categoryWithImage.thumbnailImage?.id || categoryWithImage.image?.id}`;
  }
  if (event.eventImage?.id) {
    return `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${event.slug}/image`;
  }
  return NO_IMAGE_URL;
}

export const EventCard = ({event}: EventCardProps) => {
  const {workspaceURI} = useWorkspace();

  const stripImages = (htmlContent: any = '') =>
    htmlContent?.replace(/<img[^>]*>/g, '');

  return (
    <Card className="p-2 overflow-hidden cursor-pointer rounded-2xl flex gap-6 h-fit border-none shadow-none ">
      <div className="w-[150px] h-[150px] rounded-lg  flex-shrink-0 relative">
        <Image
          height={150}
          width={150}
          alt="Event image"
          className="rounded-lg w-[150px] h-[150px] object-cover"
          src={getListEventImageURL({event, workspaceURI})}
        />
      </div>

      <div className="flex w-full gap-10 py-2">
        <div
          className={`flex flex-col flex-1 ${styles['event-details-container']}`}>
          <CardHeader className="w-full p-0">
            <CardTitle className="flex flex-col xs:flex-row items-start justify-between w-full ">
              <p className="text-base font-semibold w-full flex justify-between">
                {event.eventTitle}
                {event?.isRegistered && (
                  <Badge
                    variant="outline"
                    className="text-[0.625rem] font-medium py-1 px-2 text-success border-success h-6 flex flex-none">
                    {i18n.t('#Registered')}
                  </Badge>
                )}
              </p>
            </CardTitle>
            <CardDescription className="text-sm font-medium text-secondary">
              {`${formatDateTime(event.eventStartDateTime, {
                dateFormat: 'MMMM D YYYY - ',
                timeFormat: 'h:mmA',
              })}
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
          <CardContent className="p-0 mt-1">
            <InnerHTML
              className={`text-sm max-h-[6.375rem] w-full font-normal line-clamp-2 text-gray-dark overflow-hidden ${mainStyles['constrained-content']} prose`}
              content={
                event?.eventDescription
                  ? stripImages(event.eventDescription)
                  : ''
              }
            />
          </CardContent>
        </div>
        <div className="flex-col hidden lg:flex items-center justify-center pr-2">
          <Button className="bg-success-light hover:bg-success-light text-success hover:text-success h-10 w-10 p-0 rounded-lg">
            <MdChevronRight className="h-6 w-6" />
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
