'use server';

import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {getLoginURL} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {ensureAuth} from '../utils/auth-helper';
import {findProductAccess} from '../orm/orm';

// ---- LOAD PRODUCT FOR EDITING ---- //
import {clone} from '@/utils';
import type {Cloned} from '@/types/util';
import {findMyProductWithVersions} from '../orm/orm';
import type {MyProductWithVersions} from '../orm/orm';

export async function loadMyProductForEdit({
  productId,
  workspaceURL,
}: {
  productId: string;
  workspaceURL: string;
}): ActionResponse<Cloned<MyProductWithVersions>> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const product = await findMyProductWithVersions({
    productId,
    userId: auth.user.id,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {success: true, data: clone(product)};
}

// ---- VALIDATION SCHEMAS ---- //
const AddToFavoritesSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  workspaceURI: z.string().min(1),
  returnUrl: z.string().min(1),
});

type AddToFavoritesInput = z.infer<typeof AddToFavoritesSchema>;

// ---- ACTIONS ---- //
export async function addProductToFavorites(
  input: AddToFavoritesInput,
): ActionResponse<true> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  // Validate input
  const result = AddToFavoritesSchema.safeParse(input);
  if (!result.success) {
    return {
      error: true,
      message: await t('Invalid input'),
    };
  }

  const {productId, workspaceURL, workspaceURI, returnUrl} = result.data;

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId);
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: returnUrl,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const client = auth.tenant.client;
  const partnerId = auth.user.id;

  try {
    const product = await findProductAccess({
      recordId: productId,
      client,
      workspace: auth.workspace,
      select: {id: true},
    });

    if (!product) {
      return {
        error: true,
        message: await t('Product not found or access denied'),
      };
    }

    const partner = await client.aOSPartner.findOne({
      where: {id: partnerId},
      select: {
        id: true,
        favouriteProducts: {
          where: {id: productId},
          select: {id: true},
        },
      },
    });

    if (!partner) {
      return {
        error: true,
        message: await t('Partner not found'),
      };
    }

    const isFavorite = partner.favouriteProducts?.some(
      product => product.id === productId,
    );

    // Update with new favorites list
    await client.aOSPartner.update({
      data: {
        id: partnerId,
        version: partner.version,
        favouriteProducts: {
          ...(isFavorite && {remove: productId}),
          ...(!isFavorite && {select: {id: productId}}),
        },
      },
      select: {id: true},
    });

    return {success: true, data: true};
  } catch (e) {
    if (e instanceof Error) {
      return {error: true, message: e.message};
    }
    throw e;
  }
}
