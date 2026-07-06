import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';

const resourcesConfigSelect = {
  resourcesHeroBgImage: {id: true},
  resourcesHeroDescription: true,
  resourcesHeroOverlayColorSelect: true,
  resourcesHeroTitle: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type ResourcesConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof resourcesConfigSelect}
>;

export const getResourcesConfig = cache(
  async (configId: string, client: Client): Promise<ResourcesConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: resourcesConfigSelect,
    });
  },
);
