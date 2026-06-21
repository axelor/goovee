import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {manager} from '@/lib/core/tenant/manager';
import {
  findEventDefaultPrice,
  findEventForDetail,
} from '@/subapps/events/common/orm/event';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import {EventDetails} from '@/subapps/events/common/ui/components';

export default async function Page(props: {
  params: Promise<{slug: string; tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {slug, tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) notFound();
  const {client, config} = tenant;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const [workspace, eventDetails] = await Promise.all([
    getWorkspace(workspaceURL, session?.user, client).then(clone),
    findEventForDetail({slug, workspaceURL, client, user}).then(clone),
  ]);

  if (!workspace) {
    return notFound();
  }

  if (!eventDetails) {
    return notFound();
  }

  const pricePromise = eventDetails.defaultPrice
    ? findEventDefaultPrice({
        eventId: eventDetails.id,
        workspaceURL,
        config,
        client,
        defaultPrice: eventDetails.defaultPrice,
        saleCurrency: eventDetails.eventProduct?.saleCurrency,
      })
    : undefined;

  return (
    <EventDetails
      eventDetails={eventDetails}
      workspace={workspace}
      pricePromise={pricePromise}
    />
  );
}
