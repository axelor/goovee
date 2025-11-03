import {getSession} from '@/auth';
import {notFound} from 'next/navigation';
import {workspacePathname} from '@/utils/workspace';
import Form from './form';
import {findGooveeUserByEmail, isPartner, isAdminContact} from '@/orm/partner';

export default async function Page({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant, workspaceURL} = workspacePathname(params);
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const partner = await findGooveeUserByEmail(user.email, tenant);

  if (!partner) {
    return notFound();
  }

  const isPartnerUser = Boolean(await isPartner());
  const isAdminContactUser = Boolean(
    await isAdminContact({
      tenantId: tenant,
      workspaceURL,
    }),
  );

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <Form
        partner={partner}
        isPartner={isPartnerUser}
        isAdminContact={isAdminContactUser}
      />
    </div>
  );
}
