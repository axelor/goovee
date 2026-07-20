import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import {paymentConfigSelect} from '@/orm/workspace';
import type {Payload, SelectOptions} from '@goovee/orm';

/* The marketplace slice of the workspace app config. Loaded on demand from the
 * config id carried by the workspace (the heavy config is no longer inlined on
 * the workspace object), mirroring the other sub-apps' config getters. */
const marketplaceConfigSelect = {
  allowToPublish: true,
  requiresReview: true,
  company: {id: true, timezone: true},
  defaultProductForMarketplace: {id: true, inAti: true},
  marketplaceHeroTitle: true,
  marketplaceHeroDescription: true,
  marketplaceHeroOverlayColorSelect: true,
  marketplaceHeroBgImage: {id: true},
  ...paymentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type MarketplaceConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof marketplaceConfigSelect}
>;

export const getMarketplaceConfig = cache(
  async (
    configId: string,
    client: Client,
  ): Promise<MarketplaceConfig | null> => {
    if (!configId) return null;

    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: marketplaceConfigSelect,
    });
  },
);
