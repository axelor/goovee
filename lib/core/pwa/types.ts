import {z} from 'zod';

export const PushSubscriptionKeysSchema = z.object({
  p256dh: z.string(),
  auth: z.string(),
});

export const PushSubscriptionSchema = z.object({
  endpoint: z.url(),
  expirationTime: z.number().nullable().optional(),
  keys: PushSubscriptionKeysSchema,
});

export type PushSubscriptionDTO = z.infer<typeof PushSubscriptionSchema>;

export type NotificationDTO = {
  id: string;
  version: number;
  title: string | null;
  body: string | null;
  url: string | null;
  tag: string | null;
  createdOn: Date | null;
};

/**
 * What travels inside a push payload: only the fields the top level does not
 * already carry. The service worker merges the two back into a NotificationDTO
 * before handing it to open tabs.
 */
export type NotificationRecord = Omit<NotificationDTO, 'body' | 'url' | 'tag'>;

export type PushDeliveryReport = {
  sent: number;
  expired: number;
  failed: number;
};

export type NotificationPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  badge?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  icon?: string;
  lang?: string;
  requireInteraction?: boolean;
  silent?: boolean | null;
  tenantId?: string;
  workspaceURL?: string;
  notification?: NotificationRecord;
};
