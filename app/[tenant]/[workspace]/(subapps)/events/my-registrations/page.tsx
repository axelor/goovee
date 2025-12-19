import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {t} from '@/lib/core/locale/server';
import {Tenant} from '@/lib/core/tenant';
import {
  EVENT_TYPE,
  LIMIT,
  MY_REGISTRATION_TAB_ITEMS,
  MY_REGISTRATIONS,
} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  EventCalendar,
  EventCardSkeleton,
  EventCategoryList,
  EventCategorySkeleton,
  EventCollapsible,
  EventSearch,
  EventTabs,
  EventTabsContent,
} from '@/subapps/events/common/ui/components';
import {PortalWorkspace, User} from '@/types';
import {Card} from '@/ui/components';
import {Suspense} from 'react';

export default async function Page(context: any) {
  const params = (await context?.params);
  const page = (await context?.searchParams)?.page || 1;
  const query = (await context?.searchParams)?.query || '';
  const category = (await context?.searchParams)?.category
    ? Array.isArray((await context?.searchParams)?.category)
      ? (await context?.searchParams)?.category
      : [(await context?.searchParams)?.category]
    : [];

  const date = (await context?.searchParams)?.date || undefined;
  const type = (await context?.searchParams)?.type || EVENT_TYPE.UPCOMING;

  if (!MY_REGISTRATION_TAB_ITEMS.some(item => item.label === type)) {
    return notFound();
  }

  const {tenant} = params;

  const session = await getSession();
  const user = session?.user;

  if (!user) return notFound();

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
      <div className="py-6 container mx-auto grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-4 lg:gap-6 mb-16">
        <div>
          <h2 className="text-lg font-semibold text-start mb-4 h-[3.4rem]">
            {await t(MY_REGISTRATIONS)}
          </h2>
          <Card className="p-4 border-none shadow-none flex flex-col gap-2 md:flex-row lg:flex-col h-fit rounded-2xl">
            <EventCalendar
              dateOfEvent={date}
              workspace={workspace}
              tabs={MY_REGISTRATION_TAB_ITEMS}
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
        </div>
        <div>
          <div className="mb-4 h-[3.4rem]">
            <EventSearch query={query} />
          </div>
          <EventTabs eventType={type} tabs={MY_REGISTRATION_TAB_ITEMS}>
            <Suspense fallback={<EventCardSkeleton />}>
              <EventList
                user={user}
                workspace={workspace}
                tenant={tenant}
                type={type}
                page={page}
                date={date}
                category={category}
                query={query}
              />
            </Suspense>
          </EventTabs>
        </div>
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
  query,
}: {
  date: string;
  category: any[];
  page: string | number;
  user?: User;
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  type: string;
  query: string;
}) {
  const {events, pageInfo}: any = await findEvents({
    limit: LIMIT,
    page: page,
    search: query,
    categoryids: category,
    day: new Date(date).getDate() || undefined,
    month: new Date(date).getMonth() + 1 || undefined,
    year: new Date(date).getFullYear() || undefined,
    eventType: type,
    workspace,
    tenantId: tenant,
    user,
    onlyRegisteredEvent: true,
  }).then(clone);

  return <EventTabsContent pageInfo={pageInfo} events={events} />;
}
