import {NextResponse} from 'next/server';

import {manager} from '@/tenant';
import {findPreferences} from '@/orm/notification';
import NotificationManager, {NotificationType} from '@/notification';
import {getTranslation} from '@/locale/server';
import type {PortalApp} from '@/types';

async function findAppByCode({
  code,
  tenantId,
}: {
  code: string;
  tenantId: string;
}) {
  const client = await manager.getClient(tenantId);

  return client.aOSPortalApp.findOne({
    where: {
      code,
    },
    select: {
      name: true,
      code: true,
    },
  });
}

function getCredentials(request: Request) {
  const header = request.headers.get('authorization');

  if (!header?.startsWith('Basic ')) return null;

  try {
    const value = header.split(' ')[1];
    const credentials = Buffer.from(value, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!(username && password)) return null;

    return {username, password};
  } catch (err) {
    return null;
  }
}

function response(data: any, status: number) {
  return NextResponse.json(data, {status});
}

const BATCH_SIZE = 10;

async function processBatch(
  data: any[],
  action: (data: any) => Promise<void>,
  batchSize: number = BATCH_SIZE,
): Promise<void> {
  const chunks = chunkArray(data, batchSize);

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(data => action(data)));
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function notificationTemplate({user, tenantId, app, entity}: any) {
  return `<!DOCTYPE html>
    <html>
    <head>
        <title>${await getTranslation(
          {locale: user.locale, tenant: tenantId},
          '{0} - Notifications from Goovee',
          app.name,
        )}</title>
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
            .link {
                display: inline-block;
                color: #58d59d !important;
                text-decoration: none;
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
                <h1>${await getTranslation(
                  {locale: user.locale, tenant: tenantId},
                  `You have received new notification from Goovee {0}`,
                  app.name,
                )}
                </h1>
            </div>
            <a href="${entity?.route}" target="_blank" class="link">
              ${entity?.route}
            </a>
            <div class="footer">
                <p>Best regards,<br>The Goovee Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

async function sendMail({
  user,
  tenantId,
  mail,
  app,
  entity,
}: {
  user: any;
  tenantId: string;
  mail?: {subject?: string; body?: string};
  entity: {id: string; version: number; route: string};
  app: PortalApp;
}) {
  const mailService = NotificationManager.getService(NotificationType.mail);

  mailService?.notify({
    to: user.email,
    subject:
      mail?.subject ||
      (await getTranslation(
        {locale: user.locale, tenant: tenantId},
        '{0} - Notifications from Goovee',
        app.name,
      )),
    html:
      mail?.body || (await notificationTemplate({user, tenantId, app, entity})),
  });
}

async function sendNotifications(data: {
  tenantId: string;
  workspaceUrl: string;
  code: string;
  record: {id: string};
  mail?: {
    subject?: string;
    body?: string;
  };
}) {
  const {tenantId, workspaceUrl, code, record, mail} = data;

  try {
    const client = await manager.getClient(tenantId);

    const users = await client.aOSPartner
      .find({
        select: {
          id: true,
          emailAddress: {address: true},
          localization: {code: true},
        },
      })
      .then(users =>
        users.map(u => ({
          id: u.id,
          email: u.emailAddress?.address,
          locale: u.localization?.code,
        })),
      );

    const subscribers: any = [];

    const checkSubscription = async (user: any) => {
      const preference = await findPreferences({
        user: user as any,
        tenantId,
        code,
        url: workspaceUrl,
      });

      if (!preference?.activateNotification) return;

      const entity = preference.subscriptions.find(
        (s: any) => Number(s.id) === Number(record.id),
      );

      const isSubscribed = entity?.activateNotification;

      if (isSubscribed) {
        subscribers.push({user, entity});
      }
    };

    const app: any = await findAppByCode({code, tenantId});

    processBatch(users, checkSubscription).then(() =>
      processBatch(subscribers, ({user, entity}: {user: any; entity: any}) =>
        sendMail({user, tenantId, mail, entity, app}),
      ),
    );
  } catch (err) {}
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isValidTimestamp(timestamp: number) {
  const current = Date.now();
  return Number(current) - Number(timestamp) < FIVE_MINUTES_MS;
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload) {
    return response('Payload is required', 400);
  }

  const {tenantId, workspaceUrl, code, record, timestamp} = payload;

  if (!(tenantId && workspaceUrl && code && record?.id && timestamp)) {
    return response(
      'Tenant, workspace code, record and timestamp is required',
      400,
    );
  }

  const validTimestamp = isValidTimestamp(timestamp);

  if (!validTimestamp) {
    return response('Invalid timestamp', 400);
  }

  const credentials = getCredentials(request);

  if (!credentials) {
    return response('Unauthorized', 401);
  }

  const tenant = await manager.getConfig(tenantId);

  if (!tenant) {
    return response('Invalid Tenant', 400);
  }

  if (
    !(
      tenant.aos?.auth?.username === credentials.username &&
      tenant.aos?.auth?.password === credentials.password
    )
  ) {
    return response('Unauthorized', 401);
  }

  sendNotifications(payload);

  return response('Success', 200);
}
