import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {Separator} from '@/ui/components/separator';
import {SUBAPP_CODES} from '@/constants';
import {findPreferences} from '@/orm/notification';
import {workspacePathname} from '@/utils/workspace';
import {t} from '@/locale/server';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {SectionHeader, Title} from '../common/ui/components';
import {Preference} from './preference';
import {DevicePushPreference} from './device-push-preference';
import {findSubapps} from '@/orm/workspace';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId} = params;
  const {workspaceURL: url} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const apps = await findSubapps({user, url, client});

  const [
    eventsPreference,
    newsPreference,
    resourcesPreference,
    forumPreference,
    ticketingPreference,
  ] = await Promise.allSettled(
    (
      [
        SUBAPP_CODES.events,
        SUBAPP_CODES.news,
        SUBAPP_CODES.resources,
        SUBAPP_CODES.forum,
        SUBAPP_CODES.ticketing,
      ] as const
    ).map(code =>
      findPreferences({
        code,
        client,
        url,
        user,
      }),
    ),
  ).then(results =>
    results.map(r => (r.status === 'fulfilled' && r.value ? r.value : null)),
  );

  const showEvents = apps.some(
    app => app.code === SUBAPP_CODES.events && app.isInstalled,
  );
  const showNews = apps.some(
    app => app.code === SUBAPP_CODES.news && app.isInstalled,
  );
  const showResources = apps.some(
    app => app.code === SUBAPP_CODES.resources && app.isInstalled,
  );
  const showTicketing = apps.some(
    app => app.code === SUBAPP_CODES.ticketing && app.isInstalled,
  );
  const showForum = apps.some(
    app => app.code === SUBAPP_CODES.forum && app.isInstalled,
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Team')}
        title={await t('Notifications')}
        description={await t('Choose what you receive and where.')}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <div className="space-y-4">
          <DevicePushPreference />
          <Title text={await t('Email Notifications')} />
          <Separator />
          {showEvents && (
            <Preference
              title={await t('Events')}
              code={SUBAPP_CODES.events}
              preference={eventsPreference}
            />
          )}
          {showNews && (
            <Preference
              title={await t('News')}
              code={SUBAPP_CODES.news}
              preference={newsPreference}
            />
          )}
          {showResources && (
            <Preference
              title={await t('Resources')}
              code={SUBAPP_CODES.resources}
              preference={resourcesPreference}
            />
          )}
          {showForum && (
            <Preference
              title={await t('Forum')}
              code={SUBAPP_CODES.forum}
              preference={forumPreference}
            />
          )}
          {showTicketing && (
            <Preference
              title={await t('Ticketing')}
              code={SUBAPP_CODES.ticketing}
              preference={ticketingPreference}
              hideSubscription={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
