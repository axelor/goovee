import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {priceVisibilityConfigSelect} from '@/orm/workspace';

const shellConfigSelect = {
  chatDisplayTypeSelect: true,
  company: {logo: {id: true}},
  contactEmailAddress: {address: true},
  contactName: true,
  contactPhone: true,
  homepageHeroBgImage: {id: true},
  homepageHeroDescription: true,
  homepageHeroOverlayColorSelect: true,
  homepageHeroTitle: true,
  hyperlinkList: {
    select: {
      title: true,
      link: true,
      logo: {id: true},
    },
  },
  isDisplayContact: true,
  isFixedHeader: true,
  isHomepageDisplay: true,
  isHomepageDisplayEvents: true,
  isHomepageDisplayHyperlinks: true,
  isHomepageDisplayMessage: true,
  isHomepageDisplayNews: true,
  isHomepageDisplayResources: true,
  ...priceVisibilityConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type ShellConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof shellConfigSelect}
>;

export const getShellConfig = cache(
  async (configId: string, client: Client): Promise<ShellConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: shellConfigSelect,
    });
  },
);
