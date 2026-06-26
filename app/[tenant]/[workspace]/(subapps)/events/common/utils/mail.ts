// ---- CORE IMPORTS ---- //
import {getSession} from '@/lib/core/auth';
import NotificationManager, {NotificationType} from '@/lib/core/notification';
import {html} from '@/utils/template-string';
import {findEvent} from '../orm/event';
import {generateIcs} from './index';
import {formatDate} from '@/lib/core/locale/server/formatters';
import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import type {Workspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import type {Participant} from '@/subapps/events/common/actions/validators';

type MailEvent = {
  eventTitle: string | null;
  eventPlace: string | null;
  eventAllDay: boolean | null;
  eventStartDateTime: string | Date | null;
  eventEndDateTime: string | Date | null;
  eventDescription: string | null;
  eventLink: string;
};

export async function mailTemplate({
  event,
  participant,
}: {
  event: MailEvent;
  participant: Participant;
}) {
  const {
    eventTitle,
    eventPlace,
    eventAllDay,
    eventStartDateTime,
    eventEndDateTime,
    eventDescription,
    eventLink,
  } = event;

  const {name, surname, subscriptionSet = []} = participant;
  const fullName = `${name} ${surname}`.trim();

  const formattedEventStartDateTime = await formatDate(
    eventStartDateTime ?? '',
    {
      timezone: 'Europe/Paris',
      dateFormat: 'YYYY-MM-DD HH:mm Z',
    },
  );
  const formattedEventEndDateTime = await formatDate(eventEndDateTime ?? '', {
    timezone: 'Europe/Paris',
    dateFormat: 'YYYY-MM-DD HH:mm Z',
  });
  const dateDetails = eventAllDay
    ? html`<strong>Date:</strong> ${formattedEventStartDateTime}`
    : html`<strong>Date:</strong> ${formattedEventStartDateTime} -
        ${formattedEventEndDateTime}`;

  const subscriptionDetails = subscriptionSet?.length
    ? (subscriptionSet as Array<{facility?: string | null}>)
        .map(subscription => html`<li>${subscription.facility}</li>`)
        .join('')
    : null;

  return html`
    <!doctype html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f9f9f9;
            color: #333;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: #5603ad;
            color: #fff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            line-height: 1.6;
          }
          .facilities-title {
            margin: 0;
          }
          .facility-list {
            margin: 0;
            padding-left: 20px;
          }
          .btn-container {
            text-align: center;
            margin-top: 20px;
          }
          .event-btn {
            background-color: #5603ad;
            color: #fff !important;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          }
          .event-btn:hover {
            background-color: #4a0293;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to the Event!</h1>
          </div>
          <div class="content">
            <p>Hi <b>${fullName}</b>,</p>
            <p>
              Thank you for registering for our upcoming event. Here are the
              details:
            </p>
            <p>
              <strong>Event Name:</strong> ${eventTitle}<br />
              ${dateDetails}<br />
              ${eventPlace ? `<strong>Location:</strong> ${eventPlace}` : ''}
            </p>
            ${subscriptionDetails
              ? `<p class="facilities-title"><strong>Facilities:</strong></p>
                  <ul class="facility-list">${subscriptionDetails}</ul>`
              : ''}
            ${eventDescription ? `<p>${eventDescription}</p>` : ''}
            <div class="btn-container">
              <a
                href="${eventLink}"
                class="event-btn"
                target="_blank"
                rel="noopener noreferrer">
                Go to Event
              </a>
            </div>
            <p>We look forward to seeing you there!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export const generateRegistrationMailAction = async ({
  eventId,
  participants,
  client,
  config,
  workspace,
}: {
  participants: Participant[];
  eventId: string;
  client: Client;
  config: TenantConfig;
  workspace: Workspace | Cloned<Workspace>;
}) => {
  if (![eventId, participants?.length, workspace.url].every(Boolean)) {
    console.error(
      'Missing required parameters: eventId, participants, or workspace.',
    );
    return;
  }

  const session = await getSession();
  const user = session?.user;

  const event = await findEvent({
    id: eventId,
    client,
    config,
    user,
    workspace,
  });

  if (!event) {
    console.error(`Event with ID ${eventId} not found.`);
    return;
  }

  const mailService = NotificationManager.getService(NotificationType.mail);
  if (!mailService) {
    console.error('Mail service is not available.');
    return;
  }

  const subject = `🎉 You're Registered for "${event.eventTitle}"!`;
  const ics = generateIcs(event, participants);

  const mailPromises = participants.map(async participant => {
    const emailContent = await mailTemplate({event, participant});
    return mailService.notify({
      to: participant.emailAddress,
      subject,
      html: emailContent,
      icalEvent: {
        method: 'REQUEST',
        content: ics,
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: ics,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    });
  });

  try {
    await Promise.all(mailPromises);
  } catch (error) {
    console.error('Error sending registration emails:', error);
  }
};
