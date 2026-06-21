import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {getWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {Card} from '@/ui/components/card';
import {ORDER_BY} from '@/constants';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {
  EVENT_TAB_ITEMS,
  EVENT_TYPE,
  LIMIT,
} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {getEventCategories} from '@/subapps/events/common/orm/event-category';
import type {PageInfo} from '@/types';
import type {ListEvent, Category} from '@/subapps/events/common/types';
import {
  EventCalendar,
  EventCardSkeleton,
  EventCategoryList,
  EventCategorySkeleton,
  EventCollapsible,
  EventTabs,
  EventTabsContent,
} from '@/subapps/events/common/ui/components';
import Hero from './hero';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = [searchParams?.page].flat()[0] || 1;
  const categoryIds = searchParams?.category
    ? Array.isArray(searchParams.category)
      ? searchParams.category
      : [searchParams.category]
    : [];
  const date = [searchParams?.date].flat()[0];
  const type = [searchParams?.type].flat()[0] || EVENT_TYPE.ACTIVE;

  if (!EVENT_TAB_ITEMS.some(item => item.label === type)) {
    return notFound();
  }
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await getWorkspace(workspaceURL, user, client).then(clone);

  if (!workspace) {
    return notFound();
  }

  return (
    <main className="w-full">
      <Hero workspace={workspace} />
      <div className="py-6 container mx-auto grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4 lg:gap-6 mb-16">
        <Card className="p-4 border-none shadow-none flex flex-col gap-2 md:flex-row lg:flex-col h-fit rounded-2xl">
          <EventCalendar
            dateOfEvent={date ?? ''}
            workspace={workspace}
            tabs={EVENT_TAB_ITEMS}
          />
          <EventCollapsible>
            <Suspense fallback={<EventCategorySkeleton />}>
              <Categories
                user={user}
                client={client}
                workspace={workspace}
                categoryIds={categoryIds}
              />
            </Suspense>
          </EventCollapsible>
        </Card>
        <EventTabs eventType={type} tabs={EVENT_TAB_ITEMS}>
          <Suspense fallback={<EventCardSkeleton />}>
            <EventList
              user={user}
              workspace={workspace}
              client={client}
              type={type}
              page={page}
              date={date ?? ''}
              categoryIds={categoryIds}
            />
          </Suspense>
        </EventTabs>
      </div>
    </main>
  );
}

async function Categories({
  workspace,
  user,
  client,
  categoryIds,
}: {
  user?: User;
  client: Client;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  categoryIds: string[];
}) {
  const categories: Cloned<Category>[] = await getEventCategories(
    workspace.url,
    user,
    client,
  ).then(clone);

  return (
    <EventCategoryList
      categories={categories}
      selectedCategories={categoryIds}
    />
  );
}

async function EventList({
  user,
  workspace,
  client,
  type,
  page,
  date,
  categoryIds,
}: {
  date: string;
  categoryIds: string[];
  page: string | number;
  user?: User;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  type: string;
}) {
  const {events, pageInfo}: {events: Cloned<ListEvent>[]; pageInfo: PageInfo} =
    await findEvents({
      limit: LIMIT,
      page: page,
      categoryids: categoryIds,
      day: new Date(date).getDate() || undefined,
      month: new Date(date).getMonth() + 1 || undefined,
      year: new Date(date).getFullYear() || undefined,
      eventType: type,
      workspaceURL: workspace.url,
      client,
      user,
      orderBy: {
        eventStartDateTime:
          type === EVENT_TYPE.ACTIVE ? ORDER_BY.ASC : ORDER_BY.DESC,
      },
    }).then(clone);

  return <EventTabsContent pageInfo={pageInfo} events={events} />;
}
