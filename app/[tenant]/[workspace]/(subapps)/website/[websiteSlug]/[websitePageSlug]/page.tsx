// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  canEditWiki,
  findWebsitePageBySlug,
} from '@/subapps/website/common/orm/website';
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';
import {
  getWebsiteComponent,
  getWebsitePlugins,
} from '@/subapps/website/common/utils/component';
import {MOUNT_TYPE} from '@/subapps/website/common/constants';
import {clone} from '@/utils';

export async function generateMetadata({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    websiteSlug: string;
    websitePageSlug: string;
  };
}) {
  const {workspaceURL} = workspacePathname(params);
  const {tenant, websiteSlug, websitePageSlug} = params;

  const session = await getSession();
  const user = session?.user;

  const websitePage = await findWebsitePageBySlug({
    websiteSlug,
    websitePageSlug,
    workspaceURL,
    user,
    tenantId: tenant,
  });

  if (!websitePage) {
    return null;
  }

  return {
    title: websitePage.seoTitle,
    description: websitePage.seoDescription,
    keywords: websitePage?.seoKeyword?.split(','),
  };
}

export default async function Page({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    websiteSlug: string;
    websitePageSlug: string;
  };
}) {
  const {workspaceURL, workspaceURI} = workspacePathname(params);
  const {tenant, websiteSlug, websitePageSlug} = params;

  const session = await getSession();
  const user = session?.user;

  const [canUserEditWiki, websitePage] = await Promise.all([
    canEditWiki({userId: user?.id, tenantId: tenant}),
    findWebsitePageBySlug({
      websiteSlug,
      websitePageSlug,
      workspaceURL,
      user,
      tenantId: tenant,
    }),
  ]);

  if (!websitePage) {
    return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
  }

  const codes: string[] = [];
  const components = websitePage.contentLines.map(line => {
    if (!line?.content?.component) return;
    const Component = getWebsiteComponent(line.content.component);
    codes.push(line.content.component.code!);
    return (
      <Component
        key={line.id}
        data={clone(line.content.attrs)}
        lineId={line.id}
        contentId={line.content.id}
        contentVersion={line.content.version}
        workspaceURI={workspaceURI}
        websiteSlug={websiteSlug}
        websitePageSlug={websitePageSlug}
        code={line.content.component.code}
        mountType={MOUNT_TYPE.PAGE}
        canEditWiki={canUserEditWiki}
      />
    );
  });

  const plugins = getWebsitePlugins(codes).map((Plugin, i) => (
    <Plugin key={i} />
  ));
  return (
    <>
      {plugins}
      {components}
    </>
  );
}
