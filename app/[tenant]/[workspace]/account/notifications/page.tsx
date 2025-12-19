import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {Separator} from '@/ui/components/separator';
import {SUBAPP_CODES} from '@/constants';
import {findPreferences} from '@/orm/notification';
import {workspacePathname} from '@/utils/workspace';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import {Title} from '../common/ui/components';
import {Preference} from './preference';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {tenant: tenantId} = params;
  const {workspaceURL: url} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const [
    eventsPreference,
    newsPreference,
    resourcesPreference,
    forumPreference,
    ticketingPreference,
  ] = await Promise.allSettled(
    [
      SUBAPP_CODES.events,
      SUBAPP_CODES.news,
      SUBAPP_CODES.resources,
      SUBAPP_CODES.forum,
      SUBAPP_CODES.ticketing,
    ].map(code =>
      findPreferences({
        code,
        tenantId,
        url,
        user,
      }),
    ),
  ).then(results => results.map(r => r.status === 'fulfilled' && r.value));

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <div className="space-y-20">
        <div className="space-y-4">
          <Title text={await t('Notifications')} />
          <Separator />
          <Preference
            title={await t('Events')}
            code={SUBAPP_CODES.events}
            preference={eventsPreference}
          />
          <Preference
            title={await t('News')}
            code={SUBAPP_CODES.news}
            preference={newsPreference}
          />
          <Preference
            title={await t('Resources')}
            code={SUBAPP_CODES.resources}
            preference={resourcesPreference}
          />
          <Preference
            title={await t('Forum')}
            code={SUBAPP_CODES.forum}
            preference={forumPreference}
          />
          <Preference
            title={await t('Ticketing')}
            code={SUBAPP_CODES.ticketing}
            preference={ticketingPreference}
            hideSubscription={true}
          />
        </div>
      </div>
    </div>
  );
}
