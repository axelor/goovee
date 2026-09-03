import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import {NextResponse, after} from 'next/server';
import {z} from 'zod';

import {manager} from '@/tenant';
import {getTenantConfig} from '@/tenant/config';
import type {Client} from '@/goovee/.generated/client';
import {findSubscribers} from '@/orm/notification';
import NotificationManager, {
  NotificationType,
  type MailNotificationData,
} from '@/notification';
import {getTranslation} from '@/locale/server';
import type {WorkspaceSubPath} from '@/lib/core/url';
import {tenantURLs, type ServerWorkspaceURLs} from '@/lib/core/url/scope';
import {notifyAll, type NotifyUserArgs} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {
  WorkspaceURLSchema,
  NotificationAppCodeSchema,
  type NotificationAppCode,
} from '@/utils/validators';
import {User} from '@/types';
import {APP_TITLE} from '@/constants';

type App = NonNullable<Awaited<ReturnType<typeof findAppByCode>>>;

async function findAppByCode({code, client}: {code: string; client: Client}) {
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

function isValidSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

function response(data: any, status: number) {
  return NextResponse.json(data, {status});
}

async function notificationTemplate({
  user,
  tenantId,
  app,
  route,
  sender,
}: {
  user: User;
  tenantId: string;
  app: App;
  /* Absolute, because this lands in an inbox: nothing resolves a path there. */
  route: string;
  sender: string;
}) {
  return `<!DOCTYPE html>
    <html>
    <head>
        <title>${await getTranslation(
          {locale: user.locale, tenant: tenantId},
          '{0} - Notifications from {1}',
          app.name || '',
          sender,
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
                  `You have received new notification from {0} {1}`,
                  sender,
                  app.name || '',
                )}
                </h1>
            </div>
            <a href="${route}" target="_blank" class="link">
              ${route}
            </a>
            <div class="footer">
                <p>${await getTranslation(
                  {locale: user.locale, tenant: tenantId},
                  'Best regards,',
                )}<br>${await getTranslation(
                  {locale: user.locale, tenant: tenantId},
                  'The {0} Team',
                  sender,
                )}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

async function buildNotificationMail({
  user,
  tenantId,
  mail,
  app,
  entity,
  url,
  sender,
}: {
  user: User;
  tenantId: string;
  mail?: Mail | null;
  entity: {id: string; link: WorkspaceSubPath};
  app: App;
  url: ServerWorkspaceURLs;
  sender: string;
}): Promise<MailNotificationData> {
  const html =
    mail?.content ||
    (await notificationTemplate({
      user,
      tenantId,
      app,
      route: url.forExternal(entity.link),
      sender,
    }));

  return {
    to: user.email,
    subject:
      mail?.subject ||
      (await getTranslation(
        {locale: user.locale, tenant: tenantId},
        '{0} - Notifications from {1}',
        app.name || '',
        sender,
      )),
    html: sanitizeHtml(html),
  };
}

async function buildSystemNotification({
  user,
  tenantId,
  mail,
  app,
  entity,
  workspace,
  client,
}: {
  user: User;
  tenantId: string;
  mail?: Mail | null;
  entity: {id: string; link: WorkspaceSubPath};
  app: App;
  workspace: {id: string; name: string | null; url: string};
  client: Client;
}): Promise<NotifyUserArgs> {
  return {
    userId: user.id,
    tenantId,
    workspaceURL: workspace.url,
    client,
    payload: {
      title:
        mail?.subject ||
        (await getTranslation(
          {locale: user.locale, tenant: tenantId},
          '{0} - Notifications from {1}',
          app.name || '',
          workspace.name || APP_TITLE,
        )),
      link: entity.link,
      tag: app.name
        ? NotificationTag.system(app.name, workspace.id)
        : undefined,
    },
  };
}

async function sendNotifications(data: {
  tenantId: string;
  workspace: {
    id: string;
    version: number;
    name: string | null;
    url: string;
  };
  code: NotificationAppCode;
  recordId: string;
  mail?: Mail | null;
  client: Client;
  app: App;
}) {
  const {tenantId, workspace, code, recordId, mail, client, app} = data;

  try {
    const subscribers = await findSubscribers({
      code,
      workspaceUrl: workspace.url,
      recordId,
      tenantId,
      client,
    });

    const mailService = NotificationManager.getService(
      NotificationType.mail,
      getTenantConfig(tenantId),
    );
    const sender = workspace.name || APP_TITLE;

    /* No proxy headers on this route — it sits under /api — so the workspace is
     * named from the row the webhook resolved. The mail channel needs an
     * address here; the push channel is handed the same row and works its own
     * out, so the two agree by deriving from one value.
     *
     * A row whose last segment cannot name a workspace — one still carrying a
     * percent escape, say — is refused here. Every address for it would be
     * wrong, so both channels are dropped rather than sending a link to a
     * workspace the router will not resolve, and the row is named in the log
     * because only an operator can correct it. */
    let url;
    try {
      url = tenantURLs(tenantId).workspaceByKey(workspace.url);
    } catch (err) {
      console.error(
        `[NOTIFICATIONS] Workspace '${workspace.url}' of tenant '${tenantId}' has no addressable slug; notifications for ${code}/${recordId} were not sent`,
        err,
      );
      return;
    }

    /* Both bound their own concurrency and report their own failures. */
    await Promise.all([
      mailService?.notifyAll(subscribers, ({user, entity}) =>
        buildNotificationMail({user, tenantId, mail, entity, app, url, sender}),
      ),
      notifyAll(subscribers, ({user, entity}) =>
        buildSystemNotification({
          user,
          tenantId,
          mail,
          entity,
          app,
          workspace,
          client,
        }),
      ),
    ]);
  } catch (err) {
    console.error(
      '[NOTIFICATIONS] Failed to process webhook notifications',
      err,
    );
  }
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isValidTimestamp(timestamp: number) {
  const current = Date.now();
  const ts = Number(timestamp);
  return ts <= current && current - ts < FIVE_MINUTES_MS;
}

const MailSchema = z.object({
  subject: z.string().nullish(),
  content: z.string().nullish(),
});

type Mail = z.infer<typeof MailSchema>;

const NotificationWebhookPayloadSchema = z.object({
  workspaceUrl: WorkspaceURLSchema,
  code: NotificationAppCodeSchema,
  record: z.object({
    id: z.union([z.string(), z.number()]),
  }),
  timestamp: z.number().int('Timestamp must be an integer'),
  mail: MailSchema.nullish(),
});

export async function POST(
  request: Request,
  props: {params: Promise<{tenant: string}>},
) {
  const {tenant: tenantId} = await props.params;

  const body = await request.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return response('Payload is required', 400);
  }

  const parsed = NotificationWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return response(z.prettifyError(parsed.error), 400);
  }

  const {workspaceUrl, code, record, timestamp, mail} = parsed.data;

  if (!isValidTimestamp(timestamp)) {
    return response('Invalid timestamp', 400);
  }

  const signature = request.headers.get('x-signature');

  if (!signature) {
    return response('Unauthorized', 401);
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return response('Unauthorized', 401);
  }
  const {client} = tenant;

  const secret = tenant.config.aos.webhookSecret;

  if (!secret || !isValidSignature(body, signature, secret)) {
    return response('Unauthorized', 401);
  }

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url: workspaceUrl},
    select: {id: true, name: true, url: true},
  });

  if (!workspace) {
    return response('Invalid Workspace', 401);
  }

  const app = await findAppByCode({code, client});
  if (!app) {
    return response('Invalid App', 401);
  }

  after(() =>
    sendNotifications({
      tenantId,
      code,
      recordId: String(record.id),
      mail,
      client,
      workspace,
      app,
    }),
  );

  return response('Success', 200);
}
