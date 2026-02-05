// ---- CORE IMPORTS ---- //
import NotificationManager, {NotificationType} from '@/lib/core/notification';
import {Participant} from '@/types';
import {html} from '@/utils/template-string';
import {generateIcs} from './index';
import {formatDate} from '@/lib/core/locale/server/formatters';
import type {Event} from '@/subapps/events/common/types';

export async function mailTemplate({
  event,
  participant,
}: {
  event: Event;
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
  const fullName = `${name || ''} ${surname || ''}`.trim();

  const formattedEventStartDateTime = await formatDate(eventStartDateTime, {
    timezone: 'Europe/Paris',
    dateFormat: 'YYYY-MM-DD HH:mm Z',
  });
  const formattedEventEndDateTime = await formatDate(eventEndDateTime, {
    timezone: 'Europe/Paris',
    dateFormat: 'YYYY-MM-DD HH:mm Z',
  });
  const dateDetails = eventAllDay
    ? html`<strong>Date:</strong> ${formattedEventStartDateTime}`
    : html`<strong>Date:</strong> ${formattedEventStartDateTime} -
        ${formattedEventEndDateTime}`;

  const subscriptionDetails = subscriptionSet?.length
    ? subscriptionSet
        .map((subscription: any) => html`<li>${subscription.facility}</li>`)
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

export async function cancellationMailTemplate({
  event,
  participant,
}: {
  event: Event;
  participant: Pick<Participant, 'name' | 'surname'>;
}) {
  const {
    eventTitle,
    eventPlace,
    eventAllDay,
    eventStartDateTime,
    eventEndDateTime,
    eventLink,
  } = event;

  const {name, surname} = participant;
  const fullName = `${name || ''} ${surname || ''}`.trim();

  const formattedEventStartDateTime = await formatDate(eventStartDateTime, {
    timezone: 'Europe/Paris',
    dateFormat: 'YYYY-MM-DD HH:mm Z',
  });
  const formattedEventEndDateTime = await formatDate(eventEndDateTime, {
    timezone: 'Europe/Paris',
    dateFormat: 'YYYY-MM-DD HH:mm Z',
  });
  const dateDetails = eventAllDay
    ? html`<strong>Date:</strong> ${formattedEventStartDateTime}`
    : html`<strong>Date:</strong> ${formattedEventStartDateTime} -
        ${formattedEventEndDateTime}`;

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
            background: #e53e3e;
            color: #fff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            line-height: 1.6;
          }
          .btn-container {
            text-align: center;
            margin-top: 20px;
          }
          .event-btn {
            background-color: #e53e3e;
            color: #fff !important;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          }
          .event-btn:hover {
            background-color: #c53030;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi <b>${fullName}</b>,</p>
            <p>
              Your registration for the following event has been successfully
              cancelled:
            </p>
            <p>
              <strong>Event Name:</strong> ${eventTitle}<br />
              ${dateDetails}<br />
              ${eventPlace ? `<strong>Location:</strong> ${eventPlace}` : ''}
            </p>
            <p>If this was a mistake, you can always register again.</p>
            <div class="btn-container">
              <a
                href="${eventLink}"
                class="event-btn"
                target="_blank"
                rel="noopener noreferrer">
                View Event
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export const generateRegistrationMailAction = async ({
  event,
  participants,
  workspaceURL,
  tenantId,
}: {
  participants: Participant[];
  event: Event;
  workspaceURL: string;
  tenantId: string;
}) => {
  if (![event, participants?.length, workspaceURL, tenantId].every(Boolean)) {
    console.error(
      'Missing required parameters: event, participants, workspaceURL, or tenantId.',
    );
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

export const generateCancellationMailAction = async ({
  event,
  participants,
  workspaceURL,
  tenantId,
}: {
  participants: Pick<Participant, 'emailAddress' | 'name' | 'surname'>[];
  event: Event;
  workspaceURL: string;
  tenantId: string;
}) => {
  if (![event, participants?.length, workspaceURL, tenantId].every(Boolean)) {
    console.error(
      'Missing required parameters: event, participants, workspaceURL, or tenantId.',
    );
    return;
  }

  const mailService = NotificationManager.getService(NotificationType.mail);
  if (!mailService) {
    console.error('Mail service is not available.');
    return;
  }

  const subject = `🚫 Registration Cancelled: "${event.eventTitle}"`;

  const mailPromises = participants.map(async participant => {
    const emailContent = await cancellationMailTemplate({event, participant});
    return mailService.notify({
      to: participant.emailAddress,
      subject,
      html: emailContent,
    });
  });

  try {
    await Promise.all(mailPromises);
  } catch (error) {
    console.error('Error sending cancellation emails:', error);
  }
};
