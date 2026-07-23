'use server';

import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {TENANT_HEADER} from '@/proxy';
import {t} from '@/locale/server';
import {ADDRESS_TYPE, SUBAPP_CODES} from '@/constants';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone, getPartnerId} from '@/utils';
import {
  updateDefaultDeliveryAddress,
  updateDefaultInvoicingAddress,
} from '@/orm/address';
import {
  createPartnerAddress,
  updatePartnerAddress,
  deletePartnerAddress,
  assignDefaultAddress,
} from '@/orm/address';
import {manager} from '@/tenant';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  UpdateDefaultAddressSchema,
  ConfirmAddressesSchema,
  type CreateAddress,
  type UpdateAddress,
  type UpdateDefaultAddress,
  type ConfirmAddresses,
} from '../../../common/utils/validators';
import {IdSchema} from '@/utils/validators';

// ---- LOCAL IMPORT ---- //
import {getQuotationRecord} from '@/app/[tenant]/[workspace]/account/addresses/common/utils';

export async function createAddress(data: CreateAddress) {
  const validation = CreateAddressSchema.safeParse(data);

  if (!validation.success) {
    return {error: true, message: z.prettifyError(validation.error)};
  }

  const {address, isDeliveryAddr, isInvoicingAddr, isDefaultAddr} =
    validation.data;

  const session = await getSession();
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(session && tenantId)) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {error: true, message: await t('Bad request')};
  }
  const {client} = tenant;

  const userId = getPartnerId(session?.user);

  try {
    /* createPartnerAddress does multiple writes (address record + partner fiscal
       update), so we wrap in a transaction to keep them atomic. */
    const partnerAddress = await client
      .$transaction(txClient =>
        createPartnerAddress(
          userId,
          {address, isDeliveryAddr, isInvoicingAddr, isDefaultAddr},
          txClient,
        ),
      )
      .then(clone);

    return {success: true, data: partnerAddress};
  } catch (error) {
    console.error('Create address error >>>', error);
    return {
      error: true,
      message: await t('Error creating address'),
    };
  }
}

export async function updateAddress(data: UpdateAddress) {
  const validation = UpdateAddressSchema.safeParse(data);

  if (!validation.success) {
    return {error: true, message: z.prettifyError(validation.error)};
  }

  const {id, version, address, isDeliveryAddr, isInvoicingAddr, isDefaultAddr} =
    validation.data;

  const session = await getSession();
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(session && tenantId)) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {error: true, message: await t('Bad request')};
  }
  const {client} = tenant;

  const userId = getPartnerId(session?.user);

  try {
    /* updatePartnerAddress does multiple writes (address record + partner fiscal
       update), so we wrap in a transaction to keep them atomic. */
    const partnerAddress = await client
      .$transaction(txClient =>
        updatePartnerAddress(
          userId,
          {
            id,
            version,
            address,
            isDeliveryAddr,
            isInvoicingAddr,
            isDefaultAddr,
          },
          txClient,
        ),
      )
      .then(clone);

    return {success: true, data: partnerAddress};
  } catch (error) {
    console.error('Update address error >>>', error);
    return {
      error: true,
      message: await t('Error updating address'),
    };
  }
}

export async function updateDefaultAddress(data: UpdateDefaultAddress) {
  const validation = UpdateDefaultAddressSchema.safeParse(data);

  if (!validation.success) {
    return null;
  }

  const {type, id, isDefault} = validation.data;

  const session = await getSession();
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(session && tenantId)) return null;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;
  const {client} = tenant;

  const updateHandler =
    type === ADDRESS_TYPE.delivery
      ? updateDefaultDeliveryAddress
      : updateDefaultInvoicingAddress;

  const userId = getPartnerId(session?.user);

  /* updateDefault*Address does multiple writes (unset old default + set new
     default + partner fiscal update), so we wrap in a transaction. */
  return client
    .$transaction(txClient =>
      updateHandler({
        partnerAddressId: id,
        partnerId: userId,
        client: txClient,
        isDefault,
      }),
    )
    .then(clone);
}

export async function deleteAddress(data: z.infer<typeof IdSchema>) {
  const validation = IdSchema.safeParse(data);

  if (!validation.success) {
    return {error: true, message: z.prettifyError(validation.error)};
  }

  const id = validation.data;

  const session = await getSession();
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(session?.user && tenantId)) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {error: true, message: await t('Bad request')};
  }
  const {client} = tenant;

  const {user} = session;
  const userId = getPartnerId(user);

  try {
    const address = await deletePartnerAddress(userId, id, client).then(clone);
    return {success: true, data: address};
  } catch (error) {
    console.error('Delete address error >>>', error);
    return {
      error: true,
      message: await t('Error deleting address'),
    };
  }
}

const AssignAddressDefaultSchema = z.object({
  id: IdSchema,
  kind: z.enum(['invoicing', 'delivery']),
});

export async function assignAddressDefault(
  data: z.infer<typeof AssignAddressDefaultSchema>,
) {
  const validation = AssignAddressDefaultSchema.safeParse(data);

  if (!validation.success) {
    return {error: true, message: z.prettifyError(validation.error)};
  }

  const {id, kind} = validation.data;

  const session = await getSession();
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!(session?.user && tenantId)) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {error: true, message: await t('Bad request')};
  }
  const {client} = tenant;

  const userId = getPartnerId(session.user);

  try {
    /* assignDefaultAddress does multiple writes (mark the address as the
       delivery/invoicing type + unset the previous default + set the new
       default + partner fiscal update), so we wrap it in a transaction to keep
       them atomic — mirroring updateDefaultAddress. */
    const result = await client
      .$transaction(txClient =>
        assignDefaultAddress({
          partnerId: userId,
          partnerAddressId: id,
          kind,
          client: txClient,
        }),
      )
      .then(clone);

    if (!result) {
      return {error: true, message: await t('Error updating default address')};
    }

    return {success: true, data: result};
  } catch (error) {
    console.error('Assign default address error >>>', error);
    return {error: true, message: await t('Error updating default address')};
  }
}

export async function confirmAddresses(data: ConfirmAddresses) {
  const validation = ConfirmAddressesSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: true,
      message: z.prettifyError(validation.error),
    };
  }

  const {workspaceURL, record, subAppCode} = validation.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Bad request')};
  const {client} = tenant;

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
    client,
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
    client,
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
      client,
      workspaceURL,
      subapp,
    });

    if (!response) {
      return {
        error: true,
        message: await t('Record not found.'),
      };
    }
    modelRecord = response;
  }

  try {
    const reqBody = {
      id: record.id,
      version: Number(modelRecord?.version),
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

    const result = await client.aOSOrder
      .update({data: reqBody, select: {id: true}})
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
