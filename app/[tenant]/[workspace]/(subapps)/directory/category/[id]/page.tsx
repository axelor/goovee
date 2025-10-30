import {notFound} from 'next/navigation';
import {MdOutlineNotificationAdd} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {t} from '@/lib/core/locale/server';
import {Button} from '@/ui/components';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //

import {colors} from '../../common/constants';
import {findCategory} from '../../common/orm';
import {findEntries} from '../../common/orm/directory-entry';
import type {SearchParams} from '../../common/types';
import {CategoryCard} from '../../common/ui/components/category-card';
import {Swipe} from '../../common/ui/components/swipe';
import {getOrderBy, getPages, getSkip} from '../../common/utils';
import {ensureAuth} from '../../common/utils/auth-helper';
import {Content} from '../../content';

const ITEMS_PER_PAGE = 7;
export default async function Page({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string; id: string};
  searchParams: SearchParams;
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error, auth} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();
  const {workspace} = auth;
  const {page = 1, limit = ITEMS_PER_PAGE, sort} = searchParams;

  const {id} = params;

  const [category, entries] = await Promise.all([
    findCategory({id, workspaceId: workspace.id, tenantId: tenant}),
    findEntries({
      orderBy: getOrderBy(sort),
      take: +limit,
      skip: getSkip(limit, page),
      categoryId: id,
      workspaceId: workspace.id,
      tenantId: tenant,
    }),
  ]);
  if (!category) notFound();

  const pages = getPages(entries, limit);
  const cards = category.directoryCategorySet?.map(category => (
    <CategoryCard
      workspaceURI={workspaceURI}
      id={category.id}
      key={category.id}
      icon={category.icon}
      label={category.title ?? ''}
      iconClassName={colors[category.color as keyof typeof colors] ?? ''}
    />
  ));

  return (
    <>
      <div className="container mb-5">
        <div className="flex items-center justify-between mt-5">
          <p className="text-xl font-semibold">{category.title}</p>
          {false && (
            <Button variant="success" className="flex items-center">
              <MdOutlineNotificationAdd className="size-6 me-2" />
              <span>{await t('Subscribe')}</span>
            </Button>
          )}
        </div>
        {cards && cards?.length > 0 && (
          <Swipe
            items={cards}
            className="flex justify-center items-center mt-5 p-2 space-y-2 hover:bg-slate-100 hover:shadow-md transition-all duration-300"
          />
        )}
        <Content
          url={`${workspaceURI}/directory/category/${id}`}
          workspaceURI={workspaceURI}
          workspaceId={workspace.id}
          entries={entries}
          tenant={tenant}
          pages={pages}
          searchParams={searchParams}
        />
      </div>
    </>
  );
}
