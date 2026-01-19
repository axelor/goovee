export const dynamic = 'force-dynamic';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspaceForRegistration} from '@/orm/workspace';
import {findPartnerByEmail} from '@/orm/partner';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {extractSearchParams, isExistingUser} from '../../common/utils';
import {UserExists} from '../../common/ui/components';

export default async function Page({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
    tenant: string;
  };
}) {
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

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return notFound();
  }

  return <Form workspace={workspace as PortalWorkspace} />;
}
