import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {commentConfigSelect} from '@/orm/workspace';

const ticketingConfigSelect = {
  isDisplayAssignmentBtn: true,
  isDisplayCancelBtn: true,
  isDisplayChildTicket: true,
  isDisplayCloseBtn: true,
  isDisplayRelatedTicket: true,
  isDisplayTicketParent: true,
  isShowAllTickets: true,
  isShowCreatedTicket: true,
  isShowManagedTicket: true,
  isShowMyTickets: true,
  isShowResolvedTicket: true,
  ticketHeroBgImage: {id: true},
  ticketHeroDescription: true,
  ticketHeroOverlayColorSelect: true,
  ticketHeroTitle: true,
  ticketStatusChangeMethod: true,
  ticketingFieldSet: {select: {name: true}},
  ticketingFormFieldSet: {select: {name: true}},
  ...commentConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type TicketingConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof ticketingConfigSelect}
>;

export const getTicketingConfig = cache(
  async (configId: string, client: Client): Promise<TicketingConfig | null> => {
    if (!configId) return null;
    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: ticketingConfigSelect,
    });
  },
);
