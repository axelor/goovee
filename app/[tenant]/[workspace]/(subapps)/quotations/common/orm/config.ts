import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {commentConfigSelect} from '@/orm/workspace';

const quotationsConfigSelect = {
  ...commentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type QuotationsConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof quotationsConfigSelect}
>;

export const getQuotationsConfig = cache(
  async (
    configId: string,
    client: Client,
  ): Promise<QuotationsConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: quotationsConfigSelect,
    });
  },
);
