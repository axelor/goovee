import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {getNewsConfig} from '@/subapps/news/common/orm/config';
import {DEFAULT_PAGE, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Homepage from '@/subapps/news/[[...segments]]/homepage';
import CategoryNews from '@/subapps/news/[[...segments]]/category-news';
import ArticleNews from './article-news';
import {ArticleSkeleton} from '@/subapps/news/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; segments?: string[]}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

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
          scope={access.scope}
          user={user}
          slug={slug}
        />
      </Suspense>
    );
  }

  return (
    <CategoryNews
      workspace={clone(access.workspace)}
      config={clone(config)}
      client={client}
      page={Number(page)}
      segments={segments}
      slug={slug}
    />
  );
}
