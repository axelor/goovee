// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {SUBAPP_CODES} from '@/constants';

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
  const {websiteSlug, websitePageSlug} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: true,
  });

  if (!access.ok) {
    return null;
  }

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

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
  const {websiteSlug, websitePageSlug} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const workspaceURI = access.scope.forRouter();

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceURL = access.workspace.url;

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
    return (
      <NotFound
        homePageUrl={access.scope.forRouter(`/${SUBAPP_CODES.website}`)}
      />
    );
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
