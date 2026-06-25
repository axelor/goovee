'use client';
import {authClient} from '@/lib/auth-client';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {
  Badge,
  BadgeList,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  InnerHTML,
} from '@/ui/components';
import {cn} from '@/utils/css';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  REGISTER_TAG,
  REGISTER_TO_EVENT,
} from '@/subapps/events/common/constants';
import {EventDateCard} from '@/subapps/events/common/ui/components';
import {
  hasRegistrationEnded,
  isLoginNeededForRegistration,
} from '@/subapps/events/common/utils';
import styles from './style.module.css';
import type {EventPageCardProps} from './types';

export const EventPageCard = ({eventDetails, config}: EventPageCardProps) => {
  const {
    formattedDefaultPriceAti,
    formattedDefaultPrice,
    defaultPrice,
    eventAllowRegistration,
    registrationDeadlineDateTime,
  } = eventDetails || {};
  const {workspaceURI} = useWorkspace();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const allowGuestEventRegistration = config.allowGuestEventRegistration;

  const allowGuests =
    allowGuestEventRegistration && !isLoginNeededForRegistration(eventDetails);

  const isRegistrationAllow =
    eventAllowRegistration &&
    (user || allowGuests) &&
    !hasRegistrationEnded(eventDetails);

  return (
    <Card className="w-full rounded-2xl border-none shadow-none">
      <CardHeader className="p-4 flex flex-col gap-4 space-y-0">
        <CardTitle className="w-full flex items-center justify-between">
          <p className="text-xl font-semibold">{eventDetails?.eventTitle}</p>
          {eventDetails?.isRegistered && (
            <Badge
              variant="outline"
              className="text-[0.625rem] mb-[0.688rem] font-medium py-1 px-2 text-success border-success h-6">
              {i18n.t(REGISTER_TAG)}
            </Badge>
          )}
        </CardTitle>
        <EventDateCard
          startDate={eventDetails?.eventStartDateTime}
          endDate={eventDetails?.eventEndDateTime}
          eventAllDay={eventDetails?.eventAllDay}
        />
        <BadgeList items={eventDetails?.eventCategorySet} />
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="relative h-[15.625rem]">
          <Image
            src={
              eventDetails.eventImage?.id
                ? withBasePath(
                    `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${eventDetails.slug}/image`,
                  )
                : withBasePath(NO_IMAGE_URL)
            }
            alt={`${eventDetails.eventTitle} image`}
            fill
            className="rounded-lg mx-auto object-cover"
            sizes="(min-width: 1024px) 1152px, 100vw"
          />
        </div>
        <InnerHTML
          className={cn(
            'text-sm font-normal tracking-wide leading-6 w-full overflow-x-auto text-slate-500 dark:text-slate-400',
            styles['card-description-html'],
          )}
          content={eventDetails?.eventDescription ?? undefined}
        />
        <div className="border-l border-success space-y-4 text-base font-semibold px-4">
          {eventDetails?.eventPlace && (
            <p>
              {i18n.t('Place')}:{' '}
              <span className="font-normal break-words">
                {eventDetails?.eventPlace}
              </span>
            </p>
          )}
          {defaultPrice ? (
            <div className="flex flex-col gap-2 font-semibold">
              <p className="text-xl text-black">
                {i18n.t('Price (incl. tax)')}:{' '}
                <span className="text-success">{formattedDefaultPriceAti}</span>
              </p>
              <p className="text-sm text-black flex gap-2">
                {i18n.t('Price (excl. tax)')}:{' '}
                <span className="text-success">{formattedDefaultPrice}</span>
              </p>
            </div>
          ) : null}
          {eventAllowRegistration && registrationDeadlineDateTime && (
            <p>
              {i18n.t('Registration deadline')}:{' '}
              <span className="font-normal text-destructive">
                {formatDateTime(registrationDeadlineDateTime, {
                  dateFormat: 'MMMM D YYYY,',
                  timeFormat: ' h:mm a',
                })}
              </span>
            </p>
          )}
        </div>
      </CardContent>
      {isRegistrationAllow && (
        <CardFooter className="px-4 pb-4">
          {
            <Link
              prefetch
              href={`${workspaceURI}/${SUBAPP_CODES.events}/${eventDetails?.slug}/register`}
              className="w-full">
              <Button
                size="sm"
                variant="success"
                className="w-full text-base font-medium">
                {i18n.t(REGISTER_TO_EVENT)}
              </Button>
            </Link>
          }
        </CardFooter>
      )}
    </Card>
  );
};
