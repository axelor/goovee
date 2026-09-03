import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {SUBAPP_CODES} from '@/constants';
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

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const workspaceURI = access.url.forRouter();

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceURL = access.workspace.url;

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
      access.url.forRouter(
        `/${SUBAPP_CODES.website}/${websiteSlug}/${websitePageSlug}`,
      ),
    );
  }

  return (
    <NotFound homePageUrl={access.url.forRouter(`/${SUBAPP_CODES.website}`)} />
  );
}
