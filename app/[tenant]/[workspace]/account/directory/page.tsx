import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findGooveeUserByEmail, isAdminContact} from '@/orm/partner';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import Form from './form';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return notFound();
  }

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
