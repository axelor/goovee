export const dynamic = 'force-dynamic';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getTranslation} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';

// ---- LOCAL IMPORTS ---- //
import {extractSearchParams, isExistingUser} from '../../register/common/utils';
import Content from './content';

function Description({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="container space-y-6 mt-8">
      <h1 className="text-[2rem] font-bold">{title}</h1>
      <div className="bg-white py-4 px-6">
        <p>{description}</p>
      </div>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
    tenant: string;
    callbackurl: string;
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
    return (
      <Description
        title={await getTranslation({tenant: tenantId}, 'Log In')}
        description={await getTranslation(
          {tenant: tenantId},
          'Login with your keycloak account to continue.',
        )}
      />
    );
  }

  const partner = await findGooveeUserByEmail(user.email, tenantId);

  if (!partner) {
    return (
      <Description
        title={await getTranslation({tenant: tenantId}, 'Log In')}
        description={await getTranslation(
          {tenant: tenantId},
          'We cannot find your record.',
        )}
      />
    );
  }

  const existing = await isExistingUser({
    workspaceURL,
    tenantId,
    user: {
      isContact: partner.isContact,
      id: partner.id,
      mainPartnerId: partner.isContact ? partner.mainPartner?.id : undefined,
      email: user.email,
    },
  });

  if (!existing) {
    return (
      <Description
        title={await getTranslation({tenant: tenantId}, 'Log In')}
        description={await getTranslation(
          {tenant: tenantId},
          'You are not a member of this workspace.',
        )}
      />
    );
  }

  return <Content partner={partner} />;
}
