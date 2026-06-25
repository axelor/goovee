'use client';

// ---- CORE IMPORTS ---- //
import {PortalAppConfig} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import {isCommentEnabled} from '@/comments';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  EventPageCard,
  CommentsSection,
} from '@/subapps/events/common/ui/components';
import type {FullEvent} from '@/subapps/events/common/orm/event';

export function EventDetails({
  eventDetails,
  config,
}: {
  eventDetails: Cloned<FullEvent>;
  config: PortalAppConfig | Cloned<PortalAppConfig>;
}) {
  const eventId = eventDetails.id;

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.events,
    config,
  });
  return (
    <div className="container mx-auto flex flex-col gap-6 pt-6 pb-24 lg:pb-6">
      <EventPageCard eventDetails={eventDetails} config={config} />
      {enableComment && (
        <CommentsSection eventId={eventId} slug={eventDetails.slug} />
      )}
    </div>
  );
}
