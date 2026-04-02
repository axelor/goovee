import sanitizeHtml from 'sanitize-html';

// ---- CORE IMPORTS ---- //
import type {Comment} from '@/comments';
import type {Track} from '@/lib/core/comments';
import {DEFAULT_LOCALE} from '@/lib/core/locale';
import {getTranslation} from '@/lib/core/locale/server';
import NotificationManager, {NotificationType} from '@/notification';
import {html} from '@/utils/template-string';

// ---- LOCAL IMPORTS ---- //
import type {NotificationPartner} from '../orm/mail';

export async function sendCommentMail(props: {
  comment: Comment;
  parentComment?: Comment;
  reciepients: NotificationPartner[];
  projectName: string;
  ticketName: string;
  ticketLink: string;
  tenant: string;
}) {
  const {
    comment,
    parentComment,
    reciepients,
    projectName,
    ticketName,
    ticketLink,
    tenant,
  } = props;
  const mailService = NotificationManager.getService(NotificationType.mail);
  if (!mailService) {
    console.error('Mail service is not available.');
    return;
  }

  const note = sanitizeHtml(comment.note || '');
  const parentNote = sanitizeHtml(parentComment?.note || '');

  reciepients.forEach(async partner => {
    const t = getTranslation.bind(null, {
      locale: partner.localization?.code || DEFAULT_LOCALE,
      tenant,
    });

    const subject = await t(
      'New comment by {0}',
      comment.partner?.simpleFullName || comment.partner?.name || '',
    );
    const title = subject;

    const content = html`<p style="margin: 0 0 8px 0;">
        <strong>${await t('Comment left by')}:</strong>
        <span style="color: #1e40af;"
          >${comment.partner?.simpleFullName ?? comment.partner?.name}</span
        >
      </p>
      ${parentComment
        ? html`<div
              style="border-left: 4px solid #1e40af;  margin: 12px 0;  border-radius: 4px;">
              <div style="background-color: #ecfdf5; padding-left: 12px;">
                <p
                  style="margin: 0 0 4px 0; font-weight: bold; color: #0f172a;">
                  ${parentComment.partner?.simpleFullName ||
                  parentComment.partner?.name ||
                  parentComment.createdBy?.fullName}
                </p>
                <p
                  style="margin: 0; color: #374151; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                  ${parentNote}
                </p>
              </div>
              <div
                style="margin-left: 20px; padding-left: 12px; margin-top: 6px;">
                <p style="margin: 0; color: #111827;">${note}</p>
              </div>
            </div>
            `
        : html`<div
              style="border-left: 4px solid #1e40af; padding-left: 12px; margin: 12px 0; background-color: #f9fafb;">
              <p style="margin: 0; color: #111827;">${note}</p>
            </div>`}
  `.trim();

    const doc = await generateHTML({
      projectName,
      ticketName,
      content,
      ticketLink,
      title,
      t,
    });

    await mailService.notify({
      subject,
      to: partner.emailAddress?.address,
      html: doc,
    });
  });
}

export async function sendTrackMail(props: {
  author: string;
  type: 'create' | 'update';
  tracks: Track[];
  ticketName: string;
  projectName: string;
  ticketLink: string;
  reciepients: NotificationPartner[];
  tenant: string;
}): Promise<void> {
  const {
    author,
    type,
    projectName,
    ticketName,
    ticketLink,
    tracks,
    reciepients,
    tenant,
  } = props;
  const mailService = NotificationManager.getService(NotificationType.mail);
  if (!mailService) {
    console.error('Mail service is not available.');
    return;
  }

  reciepients.forEach(async partner => {
    const t = getTranslation.bind(null, {
      locale: partner.localization?.code || DEFAULT_LOCALE,
      tenant,
    });

    const subject = await t(
      type === 'create' ? 'Ticket Created by {0}' : 'Ticket Updated by {0}',
      author,
    );
    const title = subject;
    const content = html`<ul style="list-style: none; padding: 0; margin: 0;">
        ${(
          await Promise.all(
            tracks.map(async ({title, oldValue, value}, index) => {
              if (title === 'comment.note') return '';
              const isLast = index === tracks.length - 1;
              return html`<li
                  style=" display: flex; align-items: center; padding: 12px 0; font-size: 14px; color: #4a5568; ${!isLast
                    ? 'border-bottom: 1px solid #e2e8f0;'
                    : ''}">
                  <span style=" font-weight: 600; color: #2d3748; "
                    >${await t(title)}</span
                  >
                  <span
                    style=" color: #38a169; font-weight: 600; margin-left: auto; display: flex; align-items: center; ">
                    ${oldValue
                      ? html`<span
                            style=" color: #e53e3e; text-decoration: line-through; margin-right: 6px; font-weight: 600; "
                            >${await t(oldValue)}</span
                          >&rArr;`
                      : ''}
                    ${await t(value)}
                  </span>
                </li>`;
            }),
          )
        ).join('')}
      </ul>`;

    const doc = await generateHTML({
      title,
      projectName,
      ticketName,
      ticketLink,
      content,
      t,
    });

    await mailService.notify({
      subject,
      to: partner.emailAddress?.address,
      html: doc,
    });
  });
}

async function generateHTML(body: {
  title: string;
  ticketName: string;
  projectName: string;
  ticketLink: string;
  content: string;
  t: (key: string, ...interpolations: string[]) => Promise<string>;
}) {
  const {title, content, projectName, ticketName, ticketLink, t} = body;

  return html`
<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body
        style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
        <div
          style=" max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; ">
          <div
            style=" background: #1c1f55; color: #ffffff; padding: 16px; text-align: center; border-bottom: 1px solid #0056b3; ">
            <h1 style=" font-size: 20px; font-weight: 600; margin: 0; ">
              ${title}
            </h1>
          </div>
          <div
            style=" padding: 16px; background: #f0f4f8; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 14px; ">
            <span style="font-weight: 600; color: #2c5fc3;"
              >${projectName}</span
            >
            •
            <span style="font-weight: 600; color: #38a169;">${ticketName}</span>
          </div>
          <div style="padding: 16px;">
            ${content}
            <div style="text-align: center; margin-top: 8px;">
              <a
                href="${ticketLink}"
                style=" display: inline-block; padding: 10px 20px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; ">
                ${await t('View ticket')}
              </a>
            </div>
          </div>
          <div
            style=" text-align: center; padding: 12px; font-size: 12px; color: #718096; background: #f0f4f8; border-top: 1px solid #e2e8f0; ">
            ${await t(
              'This is an automated message. Please do not reply directly to this email.',
            )}
          </div>
        </div>
      </body>
    </html>
`.trim();
}
