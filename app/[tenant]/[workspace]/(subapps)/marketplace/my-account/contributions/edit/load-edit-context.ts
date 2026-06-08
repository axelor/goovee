import {SUBAPP_CODES} from '@/constants';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {notFound, redirect} from 'next/navigation';
import {
  findCompatibilityVersions,
  findLicenses,
  findProductCategories,
  resolveNewListingCurrency,
} from '../../../common/orm';
import {ensureAuth} from '../../../common/utils/auth-helper';

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

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/contributions`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();
  /* Seller-only area — non-sellers can't reach the edit routes by URL either. */
  if (!auth.workspace.config.allowToPublish) notFound();

  const [categories, licenses, compatibilityVersions, newListingCurrency] =
    await Promise.all([
      findProductCategories({
        client: auth.tenant.client,
        take: 100,
        orderBy: {sequence: 'ASC'},
      }),
      findLicenses({client: auth.tenant.client}),
      findCompatibilityVersions(auth.tenant.client),
      resolveNewListingCurrency({
        client: auth.tenant.client,
        mainPartnerId: auth.user.mainPartnerId,
      }),
    ]);

  return {
    workspaceURI,
    workspaceURL,
    tenantId,
    auth,
    categories,
    licenses,
    compatibilityVersions,
    newListingCurrency,
    requiresReview: auth.workspace.config.requiresReview === true,
    allowToPublish: auth.workspace.config.allowToPublish === true,
    inAti: auth.workspace.config.defaultProductForMarketplace?.inAti === true,
  };
}
