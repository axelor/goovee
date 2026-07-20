// ---- CORE IMPORTS ---- //
import {html} from '@/utils/template-string';
import {manager} from '@/tenant';
import NotificationManager, {NotificationType} from '@/notification';

// ---- LOCAL IMPORTS ---- //
import {NOTIFICATION_VALUES} from '@/subapps/forum/common/constants';
import {
  ContentType,
  NotificationParams,
  MailTemplateParams,
} from '@/subapps/forum/common/types/forum';

export const sendEmailNotifications = async ({
  type,
  title,
  content,
  author,
  group,
  subscribers,
  link,
  postAuthor,
  tenantId,
}: NotificationParams) => {
  try {
    if (!subscribers?.length) {
      return;
    }

    const filteredSubscribers = subscribers.filter(
      ({notificationSelect, member}) => {
        if (!member?.id) {
          return false;
        }

        switch (notificationSelect) {
          case NOTIFICATION_VALUES.ALL:
            return true;
          case NOTIFICATION_VALUES.ALL_ON_MY_POST:
            return (
              type === ContentType.POST ||
              (type === ContentType.COMMENT && postAuthor?.id === member.id)
            );
          case NOTIFICATION_VALUES.NEW_COMMENTS_ON_MY_POST:
            return type === ContentType.COMMENT && postAuthor?.id === member.id;
          case NOTIFICATION_VALUES.NONE:
            return false;
          default:
            return false;
        }
      },
    );

    if (!filteredSubscribers?.length) {
      return;
    }

    const mailService = NotificationManager.getService(
      NotificationType.mail,
      await manager.getConfig(tenantId),
    );
    if (!mailService) {
      console.error('Mail service is not available.');
      return;
    }

    for (const subscriber of filteredSubscribers) {
      try {
        if (!subscriber.member?.emailAddress?.address) {
          continue;
        }

        const emailContent = mailTemplate({
          type,
          title,
          author,
          group,
          contentSnippet: content?.slice(0, 100) + '...' || '',
          link,
          user: subscriber.member?.simpleFullName || '',
        });

        await mailService.notify({
          to: subscriber.member.emailAddress.address,
          subject: `New ${type}: ${title}`,
          html: emailContent,
        });
      } catch (error) {
        console.error(
          `Failed to send email to ${subscriber.member?.emailAddress?.address || 'Unknown Email'}:`,
          error,
        );
      }
    }

    return {success: true};
  } catch (error) {
    console.error('Error sending notifications:', error);
    return;
  }
};

function mailTemplate({
  type,
  title,
  author,
  group,
  contentSnippet,
  link,
  user,
}: MailTemplateParams) {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Forum Notification</title>
      </head>
      <body style="background-color: #f4f4f4; margin: 0; padding: 0;">
        <div
          style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div
            style="background-color: #007bff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff !important;">
              New in Your Group
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 20px; color: #333333;">
            <h2 style="font-size: 20px; margin-top: 0;">
              New ${type}: ${title}
            </h2>
            <p>Hello <strong>${user}</strong>,</p>
            <p>
              A new ${type} has been created in the group
              <strong>${group.name}</strong>:
            </p>
            <p><strong>${author.simpleFullName}</strong> wrote:</p>
            <blockquote
              style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${contentSnippet}
            </blockquote>
            <a
              href="${link}"
              style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-size: 16px;"
              target="_blank"
              rel="noopener noreferrer"
              >View Post</a
            >
          </div>
        </div>
      </body>
    </html>`;
}
