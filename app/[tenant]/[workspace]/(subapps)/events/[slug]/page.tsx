import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findEvent} from '@/subapps/events/common/orm/event';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import {EventDetails} from '@/subapps/events/common/ui/components';

export default async function Page(
  props: {
    params: Promise<{slug: string; tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {slug, tenant} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const workspace: any = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const eventDetails: any = await findEvent({
    slug,
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  if (!eventDetails) {
    return notFound();
  }

  return <EventDetails eventDetails={eventDetails} workspace={workspace} />;
}
