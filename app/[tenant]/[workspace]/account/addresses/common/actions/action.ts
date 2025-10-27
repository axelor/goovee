'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {TENANT_HEADER} from '@/middleware';
import {t} from '@/locale/server';
import {ADDRESS_TYPE, SUBAPP_CODES} from '@/constants';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {
  findCities,
  findCountry,
  updateDefaultDeliveryAddress,
  updateDefaultInvoicingAddress,
} from '@/orm/address';
import {
  createPartnerAddress,
  updatePartnerAddress,
  deletePartnerAddress,
} from '@/orm/address';
import {PartnerAddress} from '@/types';
import {manager} from '@/tenant';

// ---- LOCAL IMPORT ---- //
import {getQuotationRecord} from '@/app/[tenant]/[workspace]/account/addresses/common/utils';

export async function createAddress(values: Partial<PartnerAddress>) {
  const session = await getSession();
  const tenantId = headers().get(TENANT_HEADER);

  if (!(session && tenantId)) return null;

  const address = await createPartnerAddress(
    session.user?.id,
    values,
    tenantId,
  ).then(clone);

  return address;
}

export async function updateAddress(values: Partial<PartnerAddress>) {
  const session = await getSession();
  const tenantId = headers().get(TENANT_HEADER);

  if (!(session && tenantId)) return null;

  const address = await updatePartnerAddress(
    session.user?.id,
    values,
    tenantId,
  ).then(clone);

  return address;
}

export async function updateDefaultAddress({
  type,
  id,
  isDefault,
}: {
  type: ADDRESS_TYPE;
  id: PartnerAddress['id'];
  isDefault?: boolean;
}) {
  const session = await getSession();
  const tenantId = headers().get(TENANT_HEADER);

  if (!(session && tenantId)) return null;

  const updateHandler =
    type === ADDRESS_TYPE.delivery
      ? updateDefaultDeliveryAddress
      : updateDefaultInvoicingAddress;

  return updateHandler(id, session?.user?.id, tenantId, isDefault).then(clone);
}

export async function deleteAddress(id: PartnerAddress['id']) {
  const session = await getSession();
  const tenantId = headers().get(TENANT_HEADER);

  if (!(session?.user && tenantId && id)) return null;

  const address = await deletePartnerAddress(
    session.user?.id,
    id,
    tenantId,
  ).then(clone);

  return address;
}

export async function confirmAddresses({
  workspaceURL,
  record,
  subAppCode,
}: {
  workspaceURL: string;
  record: any;
  subAppCode: SUBAPP_CODES;
}) {
  const tenantId = headers().get(TENANT_HEADER);

  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Workspace not provided.'),
    };
  }

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!record) {
    return {
      error: true,
      message: await t('Invalid record.'),
    };
  }

  const session = await getSession();

  if (!session) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const user = session.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const subapp = await findSubappAccess({
    code: subAppCode,
    user,
    url: workspace.url,
    tenantId,
  });

  if (!subapp) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  let modelRecord;

  if (subAppCode === SUBAPP_CODES.quotations) {
    const response = await getQuotationRecord({
      id: record.id,
      user,
      tenantId,
      workspaceURL,
      subapp,
    });

    if (response.error) {
      return {
        error: true,
        message: await t(response.message || 'Record not found.'),
      };
    }
    modelRecord = response;
  }

  try {
    const reqBody = {
      id: modelRecord.id,
      version: modelRecord.version,
      mainInvoicingAddressStr: record.mainInvoicingAddress.formattedFullName,
      mainInvoicingAddress: {
        select: {
          id: record.mainInvoicingAddress.id,
        },
      },
      deliveryAddressStr: record.deliveryAddress.formattedFullName,
      deliveryAddress: {
        select: {
          id: record.deliveryAddress.id,
        },
      },
    };

    const client = await manager.getClient(tenantId);
    const result = await client.aOSOrder
      .update({data: reqBody})
      .then(clone)
      .catch(error => {
        console.error('Update error >>>', error);
      });

    return {success: true, data: result};
  } catch (error) {
    console.error('Confirm Address error >>>', error);
    return {
      error: true,
      message: await t('Something went wrong while saving address!'),
    };
  }
}
