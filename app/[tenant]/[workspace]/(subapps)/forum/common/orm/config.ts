import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {commentConfigSelect} from '@/orm/workspace';

const forumConfigSelect = {
  forumHeroBgImage: {id: true},
  forumHeroDescription: true,
  forumHeroOverlayColorSelect: true,
  forumHeroTitle: true,
  ...commentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type ForumConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof forumConfigSelect}
>;

export const getForumConfig = cache(
  async (configId: string, client: Client): Promise<ForumConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: forumConfigSelect,
    });
  },
);
