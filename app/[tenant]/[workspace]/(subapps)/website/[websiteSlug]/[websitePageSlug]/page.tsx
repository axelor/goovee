// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';

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

export async function generateMetadata(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      websiteSlug: string;
      websitePageSlug: string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);
  const {tenant, websiteSlug, websitePageSlug} = params;

  const session = await getSession();
  const user = session?.user;

  const websitePage = await findWebsitePageSeoBySlug({
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

export default async function Page(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      websiteSlug: string;
      websitePageSlug: string;
    }>;
  }
) {
  const params = await props.params;
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

  let contentLinesChunk: Promise<ReplacedContentLine[]>[] = [];

  if (websitePage?.contentLines?.length) {
    contentLinesChunk = populateLinesByChunk({
      contentLines: websitePage?.contentLines,
      tenantId: tenant,
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
