import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {otpTemplateConfigSelect} from '@/orm/workspace';

const accountConfigSelect = {
  canInviteMembers: true,
  isExistingContactsOnly: true,
  invitationTemplateList: {
    select: {
      localization: {code: true},
      template: {name: true, subject: true, content: true, language: true},
    },
  },
  ...otpTemplateConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type AccountConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof accountConfigSelect}
>;

export const getAccountConfig = cache(
  async (configId: string, client: Client): Promise<AccountConfig | null> => {
    if (!configId) return null;

    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: accountConfigSelect,
    });
  },
);
