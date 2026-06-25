import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {Website} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  findAllWebsitePages,
  findWebsiteBySlug,
} from '@/subapps/website/common/orm/website';
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: Website['slug'];
  }>;
}) {
  const params = await props.params;

  const {websiteSlug} = params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.website,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
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
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    workspaceURI,
    user,
    client,
    config,
  });

  if (!website) {
    return notFound();
  }

  let websitePageSlug = website.homepage?.slug;

  if (!websitePageSlug) {
    const pages = await findAllWebsitePages({
      websiteSlug,
      workspaceURL,
      user,
      client,
    });

    websitePageSlug = pages?.[0]?.slug;
  }

  if (websitePageSlug) {
    redirect(
      `${workspaceURI}/${SUBAPP_CODES.website}/${websiteSlug}/${websitePageSlug}`,
    );
  }

  return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
}
