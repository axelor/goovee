import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {isAdminContact, isPartner} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';

export default async function Layout(
  props: {
    children: React.ReactNode;
    params: Promise<{
      tenant: string;
      workspace: string;
    }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await getSession();
  if (!session) return notFound();

  const {tenant, workspaceURL} = workspacePathname(params);

  const isAdmin =
    (await isPartner()) ||
    (await isAdminContact({
      tenantId: tenant,
      workspaceURL,
    }));

  if (!isAdmin) {
    return notFound();
  }

  return <>{children}</>;
}
