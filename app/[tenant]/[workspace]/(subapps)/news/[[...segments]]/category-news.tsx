import {notFound} from 'next/navigation';
import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {DEFAULT_PAGE} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {Workspace} from '@/orm/workspace';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import {
  findCategoryTitleBySlugName,
  findNewsByCategory,
} from '@/subapps/news/common/orm/news';
import {NewsEditorial} from '@/subapps/news/common/ui/components';
import PaginationContent from '@/subapps/news/[[...segments]]/pagination-content';
import {NO_NEWS_AVAILABLE} from '@/subapps/news/common/constants';

const CATEGORY_LIMIT = 12;

export async function CategoryNews({
  workspace,
  client,
  page,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  segments?: string[];
  page?: number;
  slug: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const categoryTitle = await findCategoryTitleBySlugName({
    slug,
    workspace,
    client,
    user,
  });

  if (!categoryTitle) {
    return notFound();
  }

  const result = await findNewsByCategory({
    slug,
    workspace,
    client,
    user,
    page: page || DEFAULT_PAGE,
    limit: CATEGORY_LIMIT,
    orderBy: {publicationDateTime: 'DESC'},
    params: {
      select: {
        description: true,
        author: {simpleFullName: true},
      },
    },
  }).then(clone);

  const articles = (result as any)?.news || [];
  const pageInfo = (result as any)?.pageInfo;

  return (
    <NewsEditorial articles={articles} heading={categoryTitle}>
      {articles.length === 0 ? (
        <div className="py-16 text-center font-medium text-ink-500">
          {await t(NO_NEWS_AVAILABLE)}
        </div>
      ) : (
        <PaginationContent pageInfo={pageInfo} />
      )}
    </NewsEditorial>
  );
}

export default CategoryNews;
