import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {findGooveeUserByEmail} from '@/orm/partner';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {RegistrationForm} from '@/subapps/events/common/ui/components';
import {findModelFields} from '@/orm/model-fields';
import {
  CONTACT_ATTRS,
  PORTAL_PARTICIPANT_MODEL,
} from '@/subapps/events/common/constants';
import {findEvent} from '@/subapps/events/common/orm/event';
import {
  hasRegistrationEnded,
  isLoginNeededForRegistration,
} from '@/subapps/events/common/utils';

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

  const workspace = clone({...access.workspace, config: workspaceConfig});

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
    workspace.config?.allowGuestEventRegistration;
  const eventAllowRegistration = eventDetails?.eventAllowRegistration;

  const allowGuests =
    allowGuestEventRegistration && !isLoginNeededForRegistration(eventDetails);

  const isRegistrationAllow =
    eventAllowRegistration &&
    (user || allowGuests) &&
    !hasRegistrationEnded(eventDetails);

  if (!isRegistrationAllow) notFound();

  const metaFields = await findModelFields({
    modelName: PORTAL_PARTICIPANT_MODEL,
    modelField: CONTACT_ATTRS,
    client,
  }).then(clone);

  const partner = user
    ? await findGooveeUserByEmail(user.email, client).then(clone)
    : null;

  return (
    <main className="container mx-auto flex-1 py-6 flex flex-col lg:flex-row gap-6 pb-20">
      <div className="order-2 lg:order-1 space-y-6 w-full">
        <RegistrationForm
          eventDetails={eventDetails}
          metaFields={metaFields}
          workspace={workspace}
          user={partner}
        />
      </div>
    </main>
  );
}
