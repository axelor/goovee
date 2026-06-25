import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findEvent} from '@/subapps/events/common/orm/event';
import {isLoginNeededForRegistration} from '@/subapps/events/common/utils';

export default async function Page(props: {
  params: Promise<{slug: string; tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {slug} = params;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user, client} = access;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return notFound();

  const eventDetails = await findEvent({
    slug,
    workspaceURL,
    client,
    config,
    user,
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
