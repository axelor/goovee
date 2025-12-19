import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaces} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import Navigation from './navigation';
import {extractSearchParams, isExistingUser} from './common/utils';
import {UserExists} from './common/ui/components';
import {ALLOW_ALL_REGISTRATION, ALLOW_AOS_ONLY_REGISTRATION} from '@/constants';

export default async function Page(
  props: {
    searchParams: Promise<{
      workspaceURI?: string;
      tenant: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const {workspaceURI, tenantId, workspaceURL} = extractSearchParams({
    searchParams,
  });

  if (!(workspaceURI && tenantId)) {
    return notFound();
  }

  const existing = await isExistingUser({workspaceURL, tenantId});

  if (existing) {
    return <UserExists workspaceURL={workspaceURL} />;
  }

  const workspaces = await findWorkspaces({url: workspaceURL, tenantId}).then(
    clone,
  );

  const workspace = workspaces.find((w: any) => w.url === workspaceURL);

  const canRegister = [
    ALLOW_ALL_REGISTRATION,
    ALLOW_AOS_ONLY_REGISTRATION,
  ].includes(workspace?.allowRegistrationSelect);

  if (!canRegister) {
    return notFound();
  }

  return <Navigation workspace={workspace} />;
}
