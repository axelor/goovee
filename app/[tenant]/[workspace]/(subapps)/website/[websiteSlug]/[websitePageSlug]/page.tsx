// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';

// ---- LOCAL IMPORTS ---- //
import {NotFound} from '@/subapps/website/common/components/blocks/not-found';
import {MOUNT_TYPE} from '@/subapps/website/common/constants';
import {
  canEditWiki,
  findWebsitePageBySlug,
  findWebsitePageSeoBySlug,
  populateLinesByChunk,
  ReplacedContentLine,
} from '@/subapps/website/common/orm/website';
import {clone} from '@/utils';
import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {Plugins, Template} from '../client-wrapper';
import {Metadata} from 'next';

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: string;
    websitePageSlug: string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {workspaceURL, tenant} = workspacePathname(params);
  const {websiteSlug, websitePageSlug} = params;

  const access = await ensureAuth({
    code: SUBAPP_CODES.website,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    return null;
  }

  const {user} = access;
  const {client} = access.tenant;

  const websitePage = await findWebsitePageSeoBySlug({
    websiteSlug,
    websitePageSlug,
    workspaceURL,
    user,
    client,
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

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    websiteSlug: string;
    websitePageSlug: string;
  }>;
}) {
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {websiteSlug, websitePageSlug} = params;

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

  const [canUserEditWiki, websitePage] = await Promise.all([
    canEditWiki({userId: user?.id, client}),
    findWebsitePageBySlug({
      websiteSlug,
      websitePageSlug,
      workspaceURL,
      user,
      client,
    }),
  ]);

  if (!websitePage) {
    return <NotFound homePageUrl={`${workspaceURI}/${SUBAPP_CODES.website}`} />;
  }

  let contentLinesChunk: Promise<ReplacedContentLine[]>[] = [];

  if (websitePage?.contentLines?.length) {
    contentLinesChunk = populateLinesByChunk({
      contentLines: websitePage?.contentLines,
      client,
      config,
      chunkSize: 5,
    });
  }

  return (
    <>
      {contentLinesChunk.map((chunkPromise, i) => {
        return (
          <Suspense key={i}>
            <ContentChunkRenderer
              chunkPromise={chunkPromise}
              workspaceURI={workspaceURI}
              websiteSlug={websiteSlug}
              websitePageSlug={websitePageSlug}
              canEditWiki={canUserEditWiki}
            />
          </Suspense>
        );
      })}
      {
        <Suspense>
          <PluginsRenderer chunkPromises={contentLinesChunk} />
        </Suspense>
      }
    </>
  );
}
async function ContentChunkRenderer({
  chunkPromise,
  workspaceURI,
  websiteSlug,
  websitePageSlug,
  canEditWiki,
}: {
  chunkPromise: Promise<ReplacedContentLine[]>;
  workspaceURI: string;
  websiteSlug: string;
  websitePageSlug: string;
  canEditWiki: boolean;
}) {
  const lines = await chunkPromise;

  const components = lines.map(line => {
    if (!line?.content?.component) return null;
    return (
      <Template
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
        canEditWiki={canEditWiki}
      />
    );
  });

  return components;
}

async function PluginsRenderer({
  chunkPromises,
}: {
  chunkPromises: Promise<ReplacedContentLine[]>[];
}) {
  const settled = await Promise.allSettled(chunkPromises).then(r =>
    r.filter(r => r.status === 'fulfilled'),
  );

  const lines = settled.map(r => r.value).flat();

  const codes = lines
    .map(line => line?.content?.component?.code)
    .filter(Boolean) as string[];

  return <Plugins codes={codes} />;
}
