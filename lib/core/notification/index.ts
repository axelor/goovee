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
