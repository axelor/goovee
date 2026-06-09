// ---- CORE IMPORTS ---- //
import {after} from 'next/server';
import {getTranslation} from '@/locale/server';
import NotificationManager, {NotificationType} from '@/notification';
import {
  type MailConfig,
  isValidMailConfig,
  replacePlaceholders,
} from '@/orm/email-template';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {create} from '../orm';
import {Scope} from '../constants';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

const otpTemplate = ({
  email,
  otp,
  subject,
}: {
  email: string;
  otp: string;
  subject?: string;
}) => ({
  subject: 'Goovee OTP',
  to: email,
  html: otpTemplateHTML({otp}),
});

const otpTemplateHTML = ({otp}: {otp: string}) => `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Goovee OTP</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
            }
            .container {
                text-align: center;
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                margin-bottom: 20px;
            }
            .button {
                display: inline-block;
                margin: 20px 0;
                padding: 12px 20px;
                background-color: #58d59d;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
            }
            .footer {
                font-size: 14px;
                color: #666666;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>OTP for Goovee</h1>
            </div>
            <p>Your OTP for goovee is : <strong>${otp}</strong></p>
            <p>Please don't share your OTP with anyone. OTP is valid for 10 minutes</p>
            <div class="footer">
                <p>Best regards,<br>The Goovee Team</p>
            </div>
        </div>
    </body>
    </html>
    `;

export async function generateOTP({
  email,
  scope,
  tenantId,
  client,
  mailConfig,
}: {
  email: string;
  scope?: string;
  tenantId?: string;
  client: Client;
  mailConfig?: MailConfig;
}): Promise<{error: boolean; message: string} | undefined> {
  try {
    const result = await create({
      force: true,
      scope: scope || Scope.Registration,
      entity: email,
      client,
    });

    if (!result) {
      throw new Error('Error creating otp');
    }

    const mailService = NotificationManager.getService(NotificationType.mail);
    if (!result?.otp) return;

    after(async () => {
      try {
        if (mailConfig && isValidMailConfig(mailConfig)) {
          const {template} = mailConfig;

          await mailService?.notify({
            to: email,
            subject: template?.subject || 'Greetings from Goovee',
            html: replacePlaceholders({
              content: template?.content,
              values: {
                context: {
                  otp: result.otp,
                  email,
                },
              },
            }),
          });
        } else {
          await mailService?.notify(
            otpTemplate({
              email,
              otp: result.otp,
            }),
          );
        }
      } catch (err) {
        console.error('[OTP] Failed to send OTP mail', err);
      }
    });
  } catch (err) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Error creating otp, try again.',
      ),
    );
  }
}
