import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findGooveeUserByEmail, isAdminContact} from '@/orm/partner';
import {ensureAccess} from '@/lib/core/access/ensure-access';

// ---- LOCAL IMPORTS ---- //
import Form from './form';

export default async function Page() {
  const access = await ensureAccess();

  if (!access.ok) {
    return notFound();
  }

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.workspace.url;

  const partner = await findGooveeUserByEmail(user.email, client);

  if (!partner) {
    return notFound();
  }

  const isPartnerUser = !user.isContact;
  const isAdminContactUser = Boolean(
    await isAdminContact({
      client,
      workspaceURL,
    }),
  );

  return (
    <Form
      partner={partner}
      isPartner={isPartnerUser}
      isAdminContact={isAdminContactUser}
    />
  );
}
