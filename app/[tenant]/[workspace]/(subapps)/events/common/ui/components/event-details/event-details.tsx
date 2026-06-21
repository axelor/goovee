'use client';

// ---- CORE IMPORTS ---- //
import {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import {isCommentEnabled} from '@/comments';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  EventPageCard,
  CommentsSection,
} from '@/subapps/events/common/ui/components';
import type {
  EventDefaultPrice,
  EventDetailData,
} from '@/subapps/events/common/orm/event';

export function EventDetails({
  eventDetails,
  workspace,
  pricePromise,
}: {
  eventDetails: Cloned<EventDetailData>;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  pricePromise?: Promise<EventDefaultPrice>;
}) {
  const eventId = eventDetails.id;

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.events,
    workspace,
  });
  return (
    <div className="container mx-auto flex flex-col gap-6 pt-6 pb-24 lg:pb-6">
      <EventPageCard
        eventDetails={eventDetails}
        workspace={workspace}
        pricePromise={pricePromise}
      />
      {enableComment && (
        <CommentsSection eventId={eventId} slug={eventDetails.slug} />
      )}
    </div>
  );
}
