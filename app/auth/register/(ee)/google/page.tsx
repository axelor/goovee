export const dynamic = 'force-dynamic';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspaces} from '@/orm/workspace';
import {findPartnerByEmail} from '@/orm/partner';
import {clone} from '@/utils';
import {ALLOW_ALL_REGISTRATION, ALLOW_AOS_ONLY_REGISTRATION} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {extractSearchParams, isExistingUser} from '../../common/utils';
import {UserExists} from '../../common/ui/components';

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

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  /**
   * Google Oauth Uses doesn't contain id or other information
   */
  const partner = await findPartnerByEmail(user.email, tenantId);

  const existing = await isExistingUser({
    workspaceURL,
    tenantId,
    user: {
      isContact: partner?.isContact,
      id: partner?.id,
      mainPartnerId: partner?.isContact ? partner?.mainPartner?.id : undefined,
      email: user.email,
    },
  });

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

  return <Form workspace={workspace} />;
}
