import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import {otpTemplateConfigSelect, type OtpTemplateConfig} from '@/orm/workspace';

export const getAuthConfig = cache(
  async (
    configId: string,
    client: Client,
  ): Promise<OtpTemplateConfig | null> => {
    if (!configId) return null;

    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: otpTemplateConfigSelect,
    });
  },
);
