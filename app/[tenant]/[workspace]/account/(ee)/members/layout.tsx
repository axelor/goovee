import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {isAdminContact, isPartner} from '@/orm/partner';

export default async function Layout(props: {children: React.ReactNode}) {
  const {children} = props;

  const access = await ensureAccess();
  if (!access.ok) return notFound();

  const {client} = access.tenant;
  const workspaceURL = access.workspace.url;

  const isAdmin =
    (await isPartner()) ||
    (await isAdminContact({
      client,
      workspaceURL,
    }));

  if (!isAdmin) {
    return notFound();
  }

  return <>{children}</>;
}
