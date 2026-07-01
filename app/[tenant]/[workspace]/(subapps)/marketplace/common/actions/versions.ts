'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';
import {getTotal} from '@/utils/pagination';
import {headers} from 'next/headers';
import {z} from 'zod';
import {
  findMyProductVersions,
  findPublisherAccess,
  type MyProductVersion,
} from '../orm';
import {canManageProducts} from '../utils/auth-helper';
import {getMarketplaceConfig} from '../orm/config';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {getPartnerId} from '@/utils';

const loadProductVersionsSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  skip: z.number().int().nonnegative(),
  take: z.number().int().positive().max(50),
});

type LoadProductVersionsInput = z.infer<typeof loadProductVersionsSchema>;

/* A page of a product's versions for the edit dialog, plus the total (from the
 * paginated query's `_count`). Ownership is enforced by the access filter
 * inside the query. */
export async function loadProductVersions(
  input: LoadProductVersionsInput,
): ActionResponse<{
  versions: Cloned<MyProductVersion>[];
  total: number;
}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = loadProductVersionsSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {productId, workspaceURL, skip, take} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {client} = access.tenant;
  const config = await getMarketplaceConfig(access.workspace.config.id, client);
  const partnerId = getPartnerId(access.user);

  if (
    !config?.allowToPublish ||
    !canManageProducts({user: access.user, subapp: access.subapp})
  ) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  const {isPublisher} = await findPublisherAccess({
    client,
    partnerId,
    workspaceId: access.workspace.id,
  });
  if (!isPublisher) {
    return {
      error: true,
      message: await t(
        'Your account is not approved to publish on this marketplace.',
      ),
    };
  }

  const versions = await findMyProductVersions({
    productId,
    mainPartnerId: partnerId,
    client,
    workspace: access.workspace,
    take,
    skip,
  });

  return {
    success: true,
    data: {
      versions: clone(versions),
      total: getTotal(versions),
    },
  };
}
