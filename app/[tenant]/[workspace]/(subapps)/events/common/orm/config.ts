import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {commentConfigSelect, paymentConfigSelect} from '@/orm/workspace';

const eventsConfigSelect = {
  allowGuestEventRegistration: true,
  eventHeroBgImage: {id: true},
  eventHeroDescription: true,
  eventHeroOverlayColorSelect: true,
  eventHeroTitle: true,
  isCompanyOrAddressRequired: true,
  nonPublicEmailNotFoundMessage: true,
  ...paymentConfigSelect,
  ...commentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type EventsConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof eventsConfigSelect}
>;

export const getEventsConfig = cache(
  async (configId: string, client: Client): Promise<EventsConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: eventsConfigSelect,
    });
  },
);
