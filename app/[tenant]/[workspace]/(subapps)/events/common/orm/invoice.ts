import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {manager, type Tenant} from '@/tenant';
import {ID, PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {error} from '@/subapps/events/common/utils';
import {ActionResponse} from '@/types/action';

export async function createInvoice({
  workspace,
  tenantId,
  registrationId,
  currencyCode,
  paymentModeId,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  registrationId: ID;
  currencyCode: string;
  paymentModeId?: number;
}): ActionResponse<any> {
  const tenant = await manager.getTenant(tenantId);
  const aos = tenant?.config?.aos;

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
      auth: {
        username: aos.auth.username,
        password: aos.auth.password,
      },
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
