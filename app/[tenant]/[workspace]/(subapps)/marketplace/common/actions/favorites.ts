'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import {getLoginURL} from '@/utils/url';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {
  findPartnerWithFavorite,
  findProductAccess,
  setPartnerFavorite,
} from '../orm';
import {ensureAuth} from '../utils/auth-helper';

const AddToFavoritesSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  workspaceURI: z.string().min(1),
  returnUrl: z.string().min(1),
  isFavorite: z.boolean(),
});

type AddToFavoritesInput = z.infer<typeof AddToFavoritesSchema>;

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

  const result = AddToFavoritesSchema.safeParse(input);
  if (!result.success) {
    return {
      error: true,
      message: z.prettifyError(result.error),
    };
  }

  const {productId, workspaceURL, workspaceURI, returnUrl, isFavorite} =
    result.data;

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
  const userId = auth.user.id;

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

    const partner = await findPartnerWithFavorite({
      client,
      userId,
      productId,
    });

    if (!partner) {
      return {
        error: true,
        message: await t('Partner not found'),
      };
    }

    const currentlyFavorite = !!partner.favouriteMarketplaceProducts?.some(
      product => product.id === productId,
    );

    if (currentlyFavorite === isFavorite) {
      return {success: true, data: true};
    }

    await setPartnerFavorite({
      client,
      userId,
      version: partner.version,
      productId,
      isFavorite,
    });

    return {success: true, data: true};
  } catch (e) {
    if (e instanceof Error) {
      return {error: true, message: e.message};
    }
    throw e;
  }
}
