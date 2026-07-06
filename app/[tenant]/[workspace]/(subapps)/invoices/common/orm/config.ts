import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {paymentConfigSelect} from '@/orm/workspace';

const invoicesConfigSelect = {
  allowOnlinePaymentForInvoices: true,
  canPayInvoice: true,
  ...paymentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type InvoicesConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof invoicesConfigSelect}
>;

export const getInvoicesConfig = cache(
  async (configId: string, client: Client): Promise<InvoicesConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: invoicesConfigSelect,
    });
  },
);
