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
  findPublisherAccess,
  resolveNewListingCurrency,
} from '../../../common/orm';
import {canManageProducts} from '../../../common/utils/auth-helper';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getMarketplaceConfig} from '../../../common/orm/config';

/**
 * Shared setup for the contributions edit routes: resolve the workspace, run the
 * seller-only auth guard (login redirect / 404 exactly as the contributions
 * listing), and load the reference data the form needs. Returns
 * the authed context plus the currency a new listing is priced in and the
 * config flags.
 */
export async function loadEditContext(params: {
  tenant: string;
  workspace: string;
}) {
  const {workspaceURI, tenant: tenantId} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
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

  /* Seller-only area — the same hard gate as the contributions listing, so
   * non-sellers can't reach the edit routes by URL either. */
  if (
    !config?.allowToPublish ||
    !canManageProducts({user: access.user, subapp: access.subapp})
  ) {
    notFound();
  }
  const partnerId = getPartnerId(access.user);

  /* Editing also needs publisher access to this workspace, the same grant the
   * save actions check, so a partner who has not been approved — or who was
   * declined or banned — cannot open a listing's editor by URL. */
  const {isPublisher} = await findPublisherAccess({
    client,
    partnerId,
    workspaceId: access.workspace.id,
  });
  if (!isPublisher) {
    notFound();
  }

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
