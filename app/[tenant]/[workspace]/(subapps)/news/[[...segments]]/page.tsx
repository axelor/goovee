import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getNewsConfig} from '@/subapps/news/common/orm/config';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {DEFAULT_PAGE, SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Homepage from '@/subapps/news/[[...segments]]/homepage';
import CategoryNews from '@/subapps/news/[[...segments]]/category-news';
import ArticleNews from './article-news';
import {ArticleSkeleton} from '@/subapps/news/common/ui/components';

export default async function Page(props: {
  params: Promise<any>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.news,
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

  const config = await getNewsConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const {segments} = params;
  const homepage = !segments;

  const {page = DEFAULT_PAGE} = searchParams;

  if (homepage) {
    return (
      <Homepage
        workspace={clone(access.workspace)}
        config={clone(config)}
        client={client}
      />
    );
  }

  const slug = segments?.at(-1) || '';
  const articlePage = segments?.includes('article');

  if (articlePage) {
    return (
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleNews
          workspace={clone(access.workspace)}
          config={clone(config)}
          segments={segments}
          client={client}
          tenantId={tenant}
          workspaceURL={access.workspace.url}
          workspaceURI={workspaceURI}
          user={user}
          slug={slug}
        />
      </Suspense>
    );
  }

  return (
    <CategoryNews
      workspace={clone(access.workspace)}
      client={client}
      page={Number(page)}
      segments={segments}
      slug={slug}
    />
  );
}
