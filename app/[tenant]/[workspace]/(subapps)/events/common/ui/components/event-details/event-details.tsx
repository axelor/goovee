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
import type {FullEvent} from '@/subapps/events/common/orm/event';

export function EventDetails({
  eventDetails,
  workspace,
}: {
  eventDetails: Cloned<FullEvent>;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const eventId = eventDetails.id;

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.events,
    config: workspace.config,
  });
  return (
    <div className="container mx-auto flex flex-col gap-6 pt-6 pb-24 lg:pb-6">
      <EventPageCard eventDetails={eventDetails} workspace={workspace} />
      {enableComment && (
        <CommentsSection eventId={eventId} slug={eventDetails.slug} />
      )}
    </div>
  );
}
