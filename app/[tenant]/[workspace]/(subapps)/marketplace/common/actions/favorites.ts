'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {getLoginURL} from '@/utils/url';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {
  findPartnerWithFavorite,
  findProductAccess,
  setPartnerFavorite,
} from '../orm';

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

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    /* Favouriting requires a login; bounce a guest to the sign-in page with a
     * callback back to where they were, then surface other denials as errors. */
    if (access.reason === 'unauthenticated') {
      redirect(
        getLoginURL({callbackurl: returnUrl, workspaceURI, tenant: tenantId}),
      );
    }
    return {error: true, message: await accessMessage(access.reason)};
  }

  const client = access.tenant.client;
  const userId = access.user.id;

  try {
    const [product, partner] = await Promise.all([
      findProductAccess({
        recordId: productId,
        client,
        workspace: access.workspace,
        select: {id: true},
      }),
      findPartnerWithFavorite({
        client,
        userId,
        productId,
      }),
    ]);

    if (!product) {
      return {
        error: true,
        message: await t('Product not found or access denied'),
      };
    }

    if (!partner) {
      return {
        error: true,
        message: await t('Partner not found'),
      };
    }

    const currentlyFavorite = !!partner.favouriteMarketplaceProducts?.some(
      fav => fav.id === productId,
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
