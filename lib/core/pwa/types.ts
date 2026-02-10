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
  typeSelect: string | null;
  relatedId: string | null;
  relatedModel: string | null;
  createdOn: Date | null;
  _count?: string | undefined;
  _cursor?: string | undefined;
  _hasNext?: boolean | undefined;
  _hasPrev?: boolean | undefined;
};
