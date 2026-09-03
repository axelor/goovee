'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {currentWorkspace} from '@/lib/core/url/current';
import {accessMessage} from '@/lib/core/access/denial';
import {getLoginURL} from '@/utils/login-url';
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

  const {productId, returnUrl, isFavorite} = result.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
  });
  if (!access.ok) {
    /* Favouriting requires a login: a guest is sent to sign-in with
     * `returnUrl` as the callback; other denials become errors. A denial
     * carries no addresses, so the workspace comes from the address the
     * request arrived at. */
    if (access.reason === 'unauthenticated') {
      const scope = await currentWorkspace();

      redirect(
        getLoginURL({
          callbackurl: returnUrl,
          workspaceURI: scope?.forRouter(),
          tenant: tenantId,
        }),
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
