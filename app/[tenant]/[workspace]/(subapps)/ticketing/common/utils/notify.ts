// ---- CORE IMPORTS ---- //
import {MAIL_MESSAGE_TYPE, type Track} from '@/comments';
import {addComment} from '@/comments/orm';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {DEFAULT_LOCALE} from '@/lib/core/locale';
import {getTranslation} from '@/lib/core/locale/server';
import type {WorkspaceSubPath} from '@/lib/core/url';
import {tenantURLs} from '@/lib/core/url/scope';
import {notifyAll} from '@/pwa/utils';
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
  tenantId,
  workspaceURL,
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
  tenantId: string;
  /** The workspace's stored `url` — its identity; the addresses come from it. */
  workspaceURL: string;
  client: Client;
}): Promise<void> {
  const ticketSubPath: WorkspaceSubPath = `/${SUBAPP_CODES.ticketing}/projects/${ticket.project?.id}/tickets/${ticket.id}`;
  const ticketLink = tenantURLs(tenantId)
    .workspaceByKey(workspaceURL)
    .forExternal(ticketSubPath);

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

  const notifyDevices = notifyAll(contacts, async contact => {
    const tr = getTranslation.bind(null, {
      locale: contact.localization?.code || DEFAULT_LOCALE,
      tenant: tenantId,
    });

    return {
      userId: contact.id,
      tenantId,
      workspaceURL,
      client,
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
        link: ticketSubPath,
        tag: NotificationTag.ticketUpdate(ticket.id),
      },
    };
  });

  const sendTracking = async () => {
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
  };

  // Independent of each other, so neither waits on the other's fan-out.
  await Promise.all([notifyDevices, sendTracking()]);
}
