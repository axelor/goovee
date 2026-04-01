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
  notification?: NotificationDTO;
};
