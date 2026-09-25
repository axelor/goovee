// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import type {TenantConfig} from '@/tenant';

/* The event pricing the ws/portal/event/price endpoint returns for the current
 * partner: the headline price plus a per-facility breakdown and the currency. */
type EventFacilityPricing = {
  id: string | number;
  priceWT?: string;
  priceATI?: string;
};

type EventPriceWS = {
  priceWT?: string;
  priceATI?: string;
  currencyId?: string | number | null;
  currencyCode?: string | null;
  facilityPricingList?: EventFacilityPricing[];
};

export async function findProductsFromWS({
  eventId,
  config,
  partnerWorkspaceId,
  partnerId,
}: {
  eventId: string;
  config: TenantConfig;
  partnerWorkspaceId: string;
  partnerId?: string;
}): Promise<EventPriceWS | null> {
  if (!eventId || !partnerWorkspaceId) {
    return null;
  }

  if (!config?.aos?.url) {
    return null;
  }

  const {aos} = config;

  try {
    const reqBody = {
      eventId,
      partnerWorkspaceId,
      partnerId,
    };
    const res = await aosClient(aos).request<{
      status?: number;
      message?: string;
      data?: EventPriceWS;
    }>('ws/portal/event/price', {body: reqBody});

    if (res?.status === -1) {
      console.log('Error:', res);
      return null;
    }

    return res?.data || null;
  } catch (err) {
    console.log('Error:', err);
    return null;
  }
}
