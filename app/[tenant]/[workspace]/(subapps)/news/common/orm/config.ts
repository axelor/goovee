import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {commentConfigSelect} from '@/orm/workspace';

const newsConfigSelect = {
  enableRecommendedNews: true,
  enableSocialMediaSharing: true,
  isShowPublicationAuthor: true,
  isShowPublicationDate: true,
  isShowPublicationTime: true,
  newsHeroBgImage: {id: true},
  newsHeroDescription: true,
  newsHeroOverlayColorSelect: true,
  newsHeroTitle: true,
  socialMediaSelect: true,
  ...commentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type NewsConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof newsConfigSelect}
>;

export const getNewsConfig = cache(
  async (configId: string, client: Client): Promise<NewsConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: newsConfigSelect,
    });
  },
);
