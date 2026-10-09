import {z} from 'zod';

import type {MobilePlatform} from './contract';

const PLATFORMS = [
  'android',
  'ios',
] as const satisfies readonly MobilePlatform[];

/*
 * A device of the mobile app, as the app reports it through the bridge. FCM
 * registration tokens are a few hundred characters; the ceiling only keeps an
 * oversized value out of the table.
 */
export const PushDeviceSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(PLATFORMS),
});

export type PushDeviceDTO = z.infer<typeof PushDeviceSchema>;

export const PushDeviceTokenSchema = PushDeviceSchema.pick({token: true});

/* Largest body an endpoint taking one of these will hold. */
export const MAX_DEVICE_BYTES = 8 * 1024;
