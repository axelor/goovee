import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {Card} from '@/ui/components/card';
import {ORDER_BY} from '@/constants';
import type {PortalWorkspace, User} from '@/types';
import type {Tenant} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import {
  EVENT_TAB_ITEMS,
  EVENT_TYPE,
  LIMIT,
} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
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

export default async function Page(context: any) {
  const params = (await context?.params);
  const page = (await context?.searchParams)?.page || 1;
  const category = (await context?.searchParams)?.category
    ? Array.isArray((await context?.searchParams)?.category)
      ? (await context?.searchParams)?.category
      : [(await context?.searchParams)?.category]
    : [];

  const date = (await context?.searchParams)?.date || undefined;
  const type = (await context?.searchParams)?.type || EVENT_TYPE.ACTIVE;

  if (!EVENT_TAB_ITEMS.some(item => item.label === type)) {
    return notFound();
  }
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

  return (
    <main className="w-full">
      <Hero workspace={workspace} />
      <div className="py-6 container mx-auto grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4 lg:gap-6 mb-16">
        <Card className="p-4 border-none shadow-none flex flex-col gap-2 md:flex-row lg:flex-col h-fit rounded-2xl">
          <EventCalendar
            dateOfEvent={date}
            workspace={workspace}
            tabs={EVENT_TAB_ITEMS}
          />
          <EventCollapsible>
            <Suspense fallback={<EventCategorySkeleton />}>
              <Categories
                user={user}
                tenant={tenant}
                workspace={workspace}
                category={category}
              />
            </Suspense>
          </EventCollapsible>
        </Card>
        <EventTabs eventType={type} tabs={EVENT_TAB_ITEMS}>
          <Suspense fallback={<EventCardSkeleton />}>
            <EventList
              user={user}
              workspace={workspace}
              tenant={tenant}
              type={type}
              page={page}
              date={date}
              category={category}
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
  tenant,
  category,
}: {
  user?: User;
  tenant: Tenant['id'];
  workspace: PortalWorkspace;
  category: any[];
}) {
  const categories: any = await findEventCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  return (
    <EventCategoryList categories={categories} selectedCategories={category} />
  );
}

async function EventList({
  user,
  workspace,
  tenant,
  type,
  page,
  date,
  category,
}: {
  date: string;
  category: any[];
  page: string | number;
  user?: User;
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  type: string;
}) {
  const {events, pageInfo}: any = await findEvents({
    limit: LIMIT,
    page: page,
    categoryids: category,
    day: new Date(date).getDate() || undefined,
    month: new Date(date).getMonth() + 1 || undefined,
    year: new Date(date).getFullYear() || undefined,
    eventType: type,
    workspace,
    tenantId: tenant,
    user,
    orderBy: {
      eventStartDateTime:
        type === EVENT_TYPE.ACTIVE ? ORDER_BY.ASC : ORDER_BY.DESC,
    },
  }).then(clone);

  return <EventTabsContent pageInfo={pageInfo} events={events} />;
}
