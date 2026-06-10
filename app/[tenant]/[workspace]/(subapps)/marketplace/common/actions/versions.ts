'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';
import {getTotal} from '@/utils/pagination';
import {headers} from 'next/headers';
import {z} from 'zod';
import {findMyProductVersions, type MyProductVersion} from '../orm';
import {canManageProducts, ensureAuth} from '../utils/auth-helper';

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

  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
  }

  if (!auth.workspace.config.allowToPublish || !canManageProducts(auth)) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }
  const {client} = auth.tenant;

  const versions = await findMyProductVersions({
    productId,
    mainPartnerId: auth.user.mainPartnerId,
    client,
    workspace: auth.workspace,
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
