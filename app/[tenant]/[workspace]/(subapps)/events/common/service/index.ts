// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import type {TenantConfig} from '@/tenant';
import {ID} from '@/types';
import {Workspace} from '@/orm/workspace';
import {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {error} from '@/subapps/events/common/utils';

export async function createInvoice({
  workspace,
  config,
  registrationId,
  currencyCode,
  paymentModeId,
}: {
  workspace: Workspace | Cloned<Workspace>;
  config: TenantConfig;
  registrationId: ID;
  currencyCode: string;
  paymentModeId?: string;
}): ActionResponse<Record<string, unknown>> {
  const aos = config?.aos;

  /* No t() anywhere in this function: its error messages end up in the
   * payment context's failureReason (the saga is the only consumer) — an
   * admin record, not a user-facing string — and the saga may not run inside
   * a request scope, where t() would crash. */
  if (!aos?.url) {
    return error('Invoice creation failed. Webservice not available.');
  }

  try {
    const partnerWorkspaceId = workspace?.workspacePermissionConfig?.id;
    if (!partnerWorkspaceId) {
      return error('Partner workspace id is missing.');
    }

    const payload = {
      currencyCode,
      partnerWorkspaceId,
      registrationId,
      paymentModeId,
    };

    const data = await aosClient(aos).request<
      {status?: number; message?: string} & Record<string, unknown>
    >('ws/portal/invoice/eventInvoice', {body: payload});

    if (data?.status === -1) {
      return error(
        data?.message || 'AOS rejected the invoice with no error message.',
      );
    }

    return {success: true, data};
  } catch (err) {
    console.error('Invoice creation failed:', err);

    /* This message ends up in the payment context's failureReason (the saga is
     * the only consumer) — surface the actual cause so the ERP admin can act
     * on the record without digging through server logs. aosClient errors
     * already carry the method, URL and HTTP status in their message. */
    const detail = err instanceof Error ? err.message : 'Unknown error';

    return {error: true, message: `AOS event invoice call failed: ${detail}`};
  }
}

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
