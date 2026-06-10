// ---- CORE IMPORTS ---- //
import {MAIL_MESSAGE_TYPE, type Track} from '@/comments';
import {addComment} from '@/comments/orm';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {DEFAULT_LOCALE} from '@/lib/core/locale';
import {getTranslation} from '@/lib/core/locale/server';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- //
import type {UserCtx} from '../orm/helpers';
import {getMailRecipients} from '../orm/mail';
import {sendTrackMail} from './mail';

/*
 * Background side effects of a ticket mutation: tracking comment, push
 * notifications and subscription mails. Actions schedule this with after()
 * once the mutation has committed.
 */
export async function notifyTicketChange({
  type,
  ticket,
  tracks,
  contacts,
  user,
  workspaceUserId,
  workspaceURL,
  tenantId,
  client,
}: {
  type: 'create' | 'update';
  ticket: {
    id: string;
    name: string;
    project: {id: string; name: string | null} | null;
  };
  tracks: Track[];
  contacts: Array<{id: string; localization: {code: string | null} | null}>;
  user: UserCtx;
  workspaceUserId?: ID;
  workspaceURL: string;
  tenantId: string;
  client: Client;
}): Promise<void> {
  const ticketLink = `${workspaceURL}/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`;

  try {
    if (workspaceUserId) {
      await addComment({
        modelName: ModelMap[SUBAPP_CODES.ticketing]!,
        userId: user.id,
        workspaceUserId,
        recordId: ticket.id,
        subject:
          type === 'create'
            ? `Record Created by ${user.simpleFullName}`
            : `Record Updated by ${user.simpleFullName}`,
        messageBody: {
          title: type === 'create' ? 'Record created' : 'Record updated',
          tracks,
          tags: [],
        },
        messageType: MAIL_MESSAGE_TYPE.notification,
        client,
        trackingField: 'publicBody',
        commentField: 'note',
      });
    }
  } catch (e) {
    console.error('Error adding comment');
    console.error(e);
  }

  const notifyResults = await Promise.allSettled(
    contacts.map(async contact => {
      const tr = getTranslation.bind(null, {
        locale: contact.localization?.code || DEFAULT_LOCALE,
        tenant: tenantId,
      });
      await notifyUser({
        userId: contact.id,
        tenantId,
        client,
        workspaceURL,
        payload: {
          title:
            type === 'create'
              ? await tr('{0} created a new ticket', user.simpleFullName ?? '')
              : await tr('{0} updated a ticket', user.simpleFullName ?? ''),
          body:
            type === 'create'
              ? await tr(
                  '{0} created a new ticket: {1}',
                  user.simpleFullName ?? '',
                  ticket.name,
                )
              : await tr(
                  '{0} updated a ticket: {1}',
                  user.simpleFullName ?? '',
                  ticket.name,
                ),
          url: ticketLink,
          tag: NotificationTag.ticketUpdate(ticket.id),
        },
      });
    }),
  );

  notifyResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Failed to notify contact ${contacts[index].id}:`,
        result.reason,
      );
    }
  });

  try {
    const reciepients = await getMailRecipients({
      contacts,
      client,
      workspaceURL,
    });
    if (reciepients.length) {
      await sendTrackMail({
        author: user.simpleFullName || '',
        type,
        tracks,
        projectName: ticket.project?.name || '',
        ticketName: ticket.name,
        ticketLink,
        reciepients,
        tenant: tenantId,
      });
    }
  } catch (e) {
    console.error('Error sending tracking email: ');
    console.error(e);
  }
}
