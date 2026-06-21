import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {getAOSAuthHeaders} from '@/tenant/auth';
import {t} from '@/locale/server';
import type {TenantConfig} from '@/tenant';
import {ID} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';
import {getWorkspace} from '@/orm/workspace';
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

  const ws = `${aos.url}/ws/portal/invoice/eventInvoice`;

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

    const {data} = await axios.post(ws, payload, {
      headers: getAOSAuthHeaders(aos.auth),
    });

    if (data?.status === -1) {
      return error(
        await t(
          data?.message ||
            'Unable to create the invoice. Please try again later.',
        ),
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
}) {
  if (!workspaceURL && eventId) {
    return null;
  }

  if (!config?.aos?.url) {
    return [];
  }

  const session = await getSession();
  const user = session?.user;

  const workspace = await getWorkspace(workspaceURL, user, client);

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }
  const {aos} = config;

  const ws = `${aos.url}/ws/portal/event/price`;

  const partnerId = user?.id;

  try {
    const reqBody = {
      eventId,
      partnerWorkspaceId: workspace.id,
      partnerId,
    };
    const res = await axios
      .post(ws, reqBody, {headers: getAOSAuthHeaders(aos.auth)})
      .then(({data}) => data);

    if (res?.data?.status === -1) {
      console.log('Error:', res);
      return null;
    }

    return res?.data || null;
  } catch (err) {
    console.log('Error:', err);
    return null;
  }
}
