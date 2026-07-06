import {SUBAPP_CODES} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {getPartnerId} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {
  findCompatibilityVersions,
  findLicenses,
  findProductCategories,
  resolveNewListingCurrency,
} from '../../../common/orm';
import {canManageProducts} from '../../../common/utils/auth-helper';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getMarketplaceConfig} from '../../../common/orm/config';

/**
 * Shared setup for the contributions edit routes: resolve the workspace, run the
 * seller-only auth guard (login redirect / 404 exactly as the listing page),
 * and load the reference data the form needs. Returns the authed context plus
 * the workspace-default currency and config flags.
 */
export async function loadEditContext(params: {
  tenant: string;
  workspace: string;
}) {
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          tenant: tenantId,
        }),
      );
    }
    unauthorized();
  }

  const {client} = access.tenant;
  const config = await getMarketplaceConfig(access.workspace.config.id, client);

  /* Seller-only area — non-sellers can't reach the edit routes by URL either. */
  if (
    !config?.allowToPublish ||
    !canManageProducts({user: access.user, subapp: access.subapp})
  ) {
    notFound();
  }
  const partnerId = getPartnerId(access.user);

  const [categories, licenses, compatibilityVersions, newListingCurrency] =
    await Promise.all([
      findProductCategories({
        client,
        take: 100,
        orderBy: {sequence: 'ASC'},
      }),
      findLicenses({client}),
      findCompatibilityVersions(client),
      resolveNewListingCurrency({
        client,
        mainPartnerId: partnerId,
      }),
    ]);

  return {
    workspaceURI,
    workspaceURL,
    tenantId,
    access,
    partnerId,
    config,
    categories,
    licenses,
    compatibilityVersions,
    newListingCurrency,
    requiresReview: config.requiresReview === true,
    allowToPublish: config.allowToPublish === true,
    inAti: config.defaultProductForMarketplace?.inAti === true,
  };
}
