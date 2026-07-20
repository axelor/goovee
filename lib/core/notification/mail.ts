import nodemailer, {type Transporter} from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';

import type {TenantConfig} from '@/tenant';
import {NotificationService, type MailNotificationData} from '.';

export class MailNotificationService implements NotificationService {
  private transporter: Transporter;
  private from?: string;

  private constructor(transporter: Transporter, from?: string) {
    this.transporter = transporter;
    this.from = from;
  }

  static create(
    transporterConfig?: SMTPPool | SMTPPool.Options | string,
    tenantConfig?: TenantConfig | null,
  ): MailNotificationService | null {
    const mail = tenantConfig?.mail;

    if (!transporterConfig && !mail) {
      console.log('Email not configured');
      return null;
    }

    const config = mail
      ? ({
          pool: true,
          host: mail.host,
          port: mail.port,
          secure: mail.secure === true,
          auth: {
            user: mail.user,
            pass: mail.password,
          },
        } satisfies SMTPPool.Options)
      : undefined;

    const transporter = transporterConfig
      ? nodemailer.createTransport(transporterConfig)
      : nodemailer.createTransport(config);

    return new MailNotificationService(transporter, mail?.email || mail?.user);
  }

  async notify(data: MailNotificationData): Promise<SMTPPool.SentMessageInfo> {
    if (!data.to) {
      throw new Error('Recipient is required');
    }

    const {to, subject, text, html, attachments, icalEvent} = data;

    const mailOptions: Mail.Options = {
      to,
      subject,
      text,
      html,
      from: this.from,
      attachments,
      icalEvent,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

export default MailNotificationService;
