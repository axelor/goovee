// ---- CORE IMPORTS ---- //
import {dayjs} from '@/locale/dayjs';
import NotificationManager, {NotificationType} from '@/notification';
import {isSameEmail} from '@/payment/domain/email';
import {escapeHtml, html} from '@/utils/template-string';
import type {TenantConfig} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import type {RegistrationNotice} from '../orm/registration';
import {generateIcs} from './index';

type MailEvent = {
  eventTitle: string | null;
  eventPlace: string | null;
  eventAllDay: boolean | null;
  eventStartDateTime: string | Date | null;
  eventEndDateTime: string | Date | null;
  eventDescription: string | null;
};

type MailParticipant = NonNullable<
  RegistrationNotice['participantList']
>[number];

/* Formatted without the request's locale, since the mail may be sent from the
 * job clock: the pattern carries no word that a language would change. */
function formatEventDate(value: string | Date | null): string {
  if (!value) return '';
  return dayjs(value).tz('Europe/Paris').format('YYYY-MM-DD HH:mm Z');
}

/** Lines a paid registration's mail adds under the event's details, as label and value, already translated. */
export type RegistrationReceipt = ReadonlyArray<
  readonly [label: string, value: string]
>;

export function mailTemplate({
  event,
  eventLink,
  participant,
  receipt,
}: {
  event: MailEvent;
  /* Absolute, and beside the event rather than in it: this lands in an inbox,
   * where nothing resolves a path, and where the event is addressed is not an
   * attribute of the event. */
  eventLink: string;
  participant: MailParticipant;
  /* For a paid registration: what was paid and the payment's reference. A
   * guest has no account to look them up in, so the mail carries them. */
  receipt?: RegistrationReceipt;
}) {
  const {eventAllDay, eventStartDateTime, eventEndDateTime, eventDescription} =
    event;
  /* Escaped: the names are whatever the registration form was sent, and this
   * mail goes to whichever addresses it named. The description is left as the
   * rich text the event's author wrote. */
  const eventTitle = escapeHtml(event.eventTitle);
  const eventPlace = escapeHtml(event.eventPlace);
  const link = escapeHtml(eventLink);

  const {name, surname, subscriptionSet} = participant;
  const fullName = escapeHtml(`${name ?? ''} ${surname ?? ''}`.trim());

  const formattedEventStartDateTime = formatEventDate(eventStartDateTime);
  const formattedEventEndDateTime = formatEventDate(eventEndDateTime);
  const dateDetails = eventAllDay
    ? html`<strong>Date:</strong> ${formattedEventStartDateTime}`
    : html`<strong>Date:</strong> ${formattedEventStartDateTime} -
        ${formattedEventEndDateTime}`;

  const subscriptionDetails = subscriptionSet?.length
    ? subscriptionSet
        .map(
          subscription => html`<li>${escapeHtml(subscription.facility)}</li>`,
        )
        .join('')
    : null;

  const receiptDetails = receipt?.length
    ? html`<p>
          ${receipt
            .map(
              ([label, value]) => html`<strong>${escapeHtml(label)}:</strong>
                ${escapeHtml(value)}`,
            )
            .join('<br />')}
        </p>`
    : '';

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
            ${receiptDetails}
            ${subscriptionDetails
              ? `<p class="facilities-title"><strong>Facilities:</strong></p>
                  <ul class="facility-list">${subscriptionDetails}</ul>`
              : ''}
            ${eventDescription ? `<p>${eventDescription}</p>` : ''}
            <div class="btn-container">
              <a
                href="${link}"
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

/**
 * The registration mail, with its calendar invite, to every participant of a
 * registration. Leans on no request, so a paid registration's confirmation
 * job can send it as well as the free registration's own request. Handed to
 * the mail service and not waited on: delivery and its retries are the mail
 * service's, which logs each mail it gives up on.
 */
export async function sendRegistrationMail({
  notice,
  eventLink,
  config,
  receipt,
}: {
  notice: RegistrationNotice;
  eventLink: string;
  config: TenantConfig;
  /**
   * Only for a paid registration, and only in the mail to the participant
   * who paid; everyone else's mail, and a free registration's, is as it
   * always was.
   */
  receipt?: {lines: RegistrationReceipt; payer: string};
}): Promise<void> {
  const {event} = notice;
  const participants = (notice.participantList ?? []).filter(
    participant => participant.emailAddress,
  );
  if (!event || !participants.length) {
    return;
  }

  const mailService = NotificationManager.getService(
    NotificationType.mail,
    config,
  );
  if (!mailService) {
    console.error('[MAIL] Mail service is not available.');
    return;
  }

  const subject = `🎉 You're Registered for "${event.eventTitle}"!`;
  const ics = generateIcs(event, participants);

  void mailService
    .notifyAll(participants, async participant => ({
      to: participant.emailAddress,
      subject,
      html: mailTemplate({
        event,
        eventLink,
        participant,
        receipt:
          receipt && isSameEmail(participant.emailAddress, receipt.payer)
            ? receipt.lines
            : undefined,
      }),
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
    }))
    .catch(() => {});
}
