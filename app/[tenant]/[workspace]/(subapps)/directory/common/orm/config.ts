import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';

const directoryConfigSelect = {
  directoryHeroBgImage: {id: true},
  directoryHeroDescription: true,
  directoryHeroOverlayColorSelect: true,
  directoryHeroTitle: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type DirectoryConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof directoryConfigSelect}
>;

export const getDirectoryConfig = cache(
  async (configId: string, client: Client): Promise<DirectoryConfig | null> => {
    if (!configId) return null;

    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: directoryConfigSelect,
    });
  },
);
