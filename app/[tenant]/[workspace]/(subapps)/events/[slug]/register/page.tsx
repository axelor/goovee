import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {findGooveeUserByEmail} from '@/orm/partner';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

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
          config={clone(workspaceConfig)}
          user={partner}
        />
      </div>
    </main>
  );
}
