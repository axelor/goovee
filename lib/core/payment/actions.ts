'use server';

import {z} from 'zod';
import {headers} from 'next/headers';

import {manager} from '@/tenant';
import {TENANT_HEADER} from '@/proxy';
import {t} from '@/locale/server';
import type {ActionResponse} from '@/types/action';
import {HUBPISP_OPTIONS} from './adapters/hubpisp';
import {GatewaySchema} from './adapters/registry';
import {PaymentSourceSchema} from './sources/registry';
import {startPayment, type StartResult} from './start';

const StartPaymentSchema = z.object({
  gateway: GatewaySchema,
  source: PaymentSourceSchema,
  checkoutToken: z.string().min(16).max(128),
  intent: z.unknown(),
  /** A variant of the gateway, such as an instant or a standard transfer. */
  option: z.enum(HUBPISP_OPTIONS).optional(),
});

export type StartPaymentInput = z.input<typeof StartPaymentSchema>;

/**
 * The one server action behind every payment button. The browser sends which
 * gateway, which source and what it wants to pay for; the server prices it and
 * answers with the handoff.
 */
export async function startPaymentAction(
  input: StartPaymentInput,
): ActionResponse<StartResult> {
  const parsed = StartPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid payment request')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  const tenant = tenantId ? await manager.getTenant(tenantId) : null;
  if (!tenant) {
    return {error: true, message: await t('Invalid tenant')};
  }

  try {
    return await startPayment({tenant, ...parsed.data});
  } catch (error) {
    console.error('startPayment failed', error);
    return {
      error: true,
      message: await t('The payment could not be started. Please try again.'),
    };
  }
}
