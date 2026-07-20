import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';
import type {TenantConfig} from '@/tenant';
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
  static getService(
    type: NotificationType,
    tenantConfig?: TenantConfig | null,
    options?: SMTPPool | SMTPPool.Options | string,
  ): NotificationService | null {
    switch (type) {
      case NotificationType.mail:
        return MailNotificationService.create(options, tenantConfig);
      default:
        return null;
    }
  }
}

export default NotificationManager;
