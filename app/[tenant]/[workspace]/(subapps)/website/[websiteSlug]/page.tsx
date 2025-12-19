import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {Website} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  findAllWebsitePages,
  findWebsiteBySlug,
} from '@/subapps/website/common/orm/website';
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';

export default async function Layout(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      websiteSlug: Website['slug'];
    }>;
  }
) {
  const params = await props.params;
  const session = await getSession();
  const user = session?.user;

  const {tenant, websiteSlug} = params;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    user,
    tenantId: tenant,
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
      tenantId: tenant,
    });

    websitePageSlug = pages?.[0]?.slug;
  }

  if (websitePageSlug) {
    redirect(
      `${workspaceURL}/${SUBAPP_CODES.website}/${websiteSlug}/${websitePageSlug}`,
    );
  }

  return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
}
