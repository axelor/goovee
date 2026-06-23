// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {t} from '@/locale/server';
import type {TenantConfig} from '@/tenant';
import {ID} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {ActionResponse} from '@/types/action';
import type {Client} from '@/goovee/.generated/client';
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
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  config: TenantConfig;
  registrationId: ID;
  currencyCode: string;
  paymentModeId?: string;
}): ActionResponse<Record<string, unknown>> {
  const aos = config?.aos;

  if (!aos?.url) {
    return error(await t('Invoice creation failed. Webservice not available.'));
  }

  try {
    const partnerWorkspaceId = workspace?.workspacePermissionConfig?.id;
    if (!partnerWorkspaceId) {
      return error(await t('Partner workspace id is missing.'));
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
        data?.message
          ? await t(data.message)
          : await t('Unable to create the invoice. Please try again later.'),
      );
    }

    return {success: true, data};
  } catch (err) {
    console.error('Invoice creation failed:', err);
    return error(
      await t(
        'An error occurred while processing your invoice. Please try again later.',
      ),
    );
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
  workspaceURL,
  client,
  config,
  eventId,
}: {
  workspaceURL: string;
  eventId: string;
  client: Client;
  config: TenantConfig;
}): Promise<EventPriceWS | null> {
  if (!workspaceURL && eventId) {
    return null;
  }

  if (!config?.aos?.url) {
    return null;
  }

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    client,
  });

  if (!workspace) {
    return null;
  }
  const {aos} = config;

  const partnerId = user?.id;

  try {
    const reqBody = {
      eventId,
      partnerWorkspaceId: workspace.id,
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
