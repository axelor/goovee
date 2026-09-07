import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findEvent} from '@/subapps/events/common/orm/event';
import {isLoginNeededForRegistration} from '@/subapps/events/common/utils';

export default async function Page(props: {
  params: Promise<{slug: string; tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {slug} = params;
  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getEventsConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  const eventDetails = await findEvent({
    slug,
    client,
    config,
    user,
    workspace: access.workspace,
  }).then(clone);

  if (!eventDetails) {
    return notFound();
  }

  const allowGuestEventRegistration =
    workspaceConfig.allowGuestEventRegistration;
  const eventAllowRegistration = eventDetails?.eventAllowRegistration;

  const allowGuests =
    allowGuestEventRegistration && !isLoginNeededForRegistration(eventDetails);

  const isRegistrationAllow = eventAllowRegistration && (user || allowGuests);
  if (!isRegistrationAllow) {
    return notFound();
  }

  return <Content event={eventDetails} />;
}
