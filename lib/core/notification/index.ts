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
  /**
   * The notification service for a tenant.
   *
   * `tenantConfig` is required rather than optional even though it may be null:
   * mail settings are per tenant, so a call that omits it silently sends nothing
   * at all. Requiring it makes that omission a compile error instead of a
   * deployment where notifications are stored but never mailed.
   */
  static getService(
    type: NotificationType,
    tenantConfig: TenantConfig | null | undefined,
  ): NotificationService | null {
    switch (type) {
      case NotificationType.mail:
        return MailNotificationService.create(tenantConfig);
      default:
        return null;
    }
  }
}

export default NotificationManager;
