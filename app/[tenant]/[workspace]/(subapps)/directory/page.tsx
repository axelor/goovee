import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {colors} from './common/constants';
import {findCategories} from './common/orm/directory-category';
import {findEntries} from './common/orm/directory-entry';
import type {SearchParams} from './common/types';
import {CategoryCard} from './common/ui/components/category-card';
import {Swipe} from './common/ui/components/swipe';
import {getOrderBy, getPages, getSkip} from './common/utils';
import {ensureAuth} from './common/utils/auth-helper';
import {Content} from './content';
import Hero from './hero';

const ITEMS_PER_PAGE = 7;

export default async function Page({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string};
  searchParams: SearchParams;
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error, auth} = await ensureAuth(workspaceURL, tenant);
  if (error) notFound();

  const {workspace} = auth;

  const {page = 1, limit = ITEMS_PER_PAGE, sort} = searchParams;

  const [categories, entries] = await Promise.all([
    findCategories({
      workspaceId: workspace.id,
      tenantId: tenant,
    }),
    findEntries({
      orderBy: getOrderBy(sort),
      take: +limit,
      skip: getSkip(limit, page),
      workspaceId: workspace.id,
      tenantId: tenant,
    }),
  ]);

  const pages = getPages(entries, limit);
  const imageURL = workspace.config?.directoryHeroBgImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.directory}/api/hero/background`
    : IMAGE_URL;

  const cards = categories.map(category => (
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
      <Hero
        title={workspace.config?.directoryHeroTitle}
        description={workspace.config?.directoryHeroDescription}
        background={workspace.config?.directoryHeroOverlayColorSelect}
        image={imageURL}
      />
      <div className="container mb-5">
        {cards.length > 0 && (
          <Swipe
            items={cards}
            className="flex justify-center items-center mt-5 p-2 space-y-2 hover:bg-slate-100 hover:shadow-md transition-all duration-300"
          />
        )}
        <Content
          url={`${workspaceURI}/directory`}
          workspaceURI={workspaceURI}
          workspaceId={workspace.id}
          tenant={tenant}
          pages={pages}
          searchParams={searchParams}
          entries={entries}
        />
      </div>
    </>
  );
}
