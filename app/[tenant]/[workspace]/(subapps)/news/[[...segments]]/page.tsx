import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {DEFAULT_PAGE} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Homepage from '@/subapps/news/[[...segments]]/homepage';
import CategoryNews from '@/subapps/news/[[...segments]]/category-news';
import ArticleNews from './article-news';
import {ArticleSkeleton} from '@/subapps/news/common/ui/components';

export default async function Page(
  props: {
    params: Promise<any>;
    searchParams: Promise<{[key: string]: string | undefined}>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {tenant} = params;

  const session = await getSession();
  const user = session?.user;
  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const {segments} = params;
  const homepage = !segments;

  const {page = DEFAULT_PAGE} = searchParams;

  if (homepage) {
    return <Homepage workspace={workspace} tenant={tenant} />;
  }

  const slug = segments?.at(-1) || '';
  const articlePage = segments?.includes('article');

  if (articlePage) {
    return (
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleNews
          workspace={workspace}
          segments={segments}
          tenantId={tenant}
          workspaceURL={workspace.url}
          user={user}
          slug={slug}
        />
      </Suspense>
    );
  }

  return (
    <CategoryNews
      workspace={workspace}
      tenant={tenant}
      page={Number(page)}
      segments={segments}
      slug={slug}
    />
  );
}
