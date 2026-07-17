// ---- CORE IMPORTS ----//
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  EventsTabsT2,
  MobileMenuCategory,
} from '@/subapps/events/common/ui/components';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Access is gated per-page; the layout renders chrome only when access
     resolves and otherwise passes children through untouched. */
  if (!access.ok) return <>{children}</>;

  const {user} = access;
  const {client} = access.tenant;

  const [categories, registeredResult, allTabLabel, mineTabLabel]: [
    any,
    any,
    string,
    string,
  ] = await Promise.all([
    findEventCategories({
      workspaceURL: access.workspace.url,
      client,
      user,
    }).then(clone),
    user
      ? findEvents({
          limit: 200,
          page: 1,
          categoryids: [],
          eventType: EVENT_TYPE.UPCOMING,
          workspaceURL: access.workspace.url,
          client,
          user,
          onlyRegisteredEvent: true,
        }).then(clone)
      : Promise.resolve({events: []}),
    t('All events'),
    t('My registrations'),
  ]);

  const registeredCount = (registeredResult?.events ?? []).length;

  const allHref = `${workspaceURI}/${SUBAPP_CODES.events}`;
  const mineHref = `${workspaceURI}/${SUBAPP_CODES.events}/my-registrations`;

  return (
    <>
      <div className="border-b border-ink-100 bg-white shrink-0">
        <div className="max-w-[1280px] mx-auto px-8">
          <EventsTabsT2
            allHref={allHref}
            mineHref={mineHref}
            allLabel={allTabLabel}
            mineLabel={mineTabLabel}
            registeredCount={user ? registeredCount : undefined}
          />
        </div>
      </div>
      {children}
      <MobileMenuCategory categories={categories} user={user} />
    </>
  );
}
