import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';
import MailNotificationService from './mail';

export interface MailNotificationData {
  to?: string | string[] | null;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Mail.Attachment[];
  icalEvent?: Mail.IcalAttachment;
}

export interface NotificationService {
  notify(data: MailNotificationData): Promise<SMTPPool.SentMessageInfo>;

  /* Sends one mail per item, sharing the connection pool and retrying each
   * independently. `toMessage` is called per attempt, so a fan-out holds only
   * its items while it waits. Never rejects — every item comes back, carrying
   * `error` if it could not be delivered. */
  notifyAll<T>(
    items: T[],
    toMessage: (item: T) => Promise<MailNotificationData>,
  ): Promise<Array<{item: T; error?: unknown}>>;
}

export enum NotificationType {
  mail = 'mail',
}

export class NotificationManager {
  static getService(type: NotificationType): NotificationService | null {
    switch (type) {
      case NotificationType.mail:
        return MailNotificationService.create();
      default:
        return null;
    }
  }
}

export default NotificationManager;
