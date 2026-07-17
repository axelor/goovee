import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findGooveeUserByEmail, isAdminContact, isPartner} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import LayoutContent from './layout-content';
import {RoleLabel} from './common/constants';
import {Role} from './common/types';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;

  const {children} = props;

  const session = await getSession();
  if (!session) return notFound();

  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const user = session.user;

  const [partner, isPartnerUser, isAdminContactUser] = await Promise.all([
    findGooveeUserByEmail(user.email, client),
    isPartner(),
    isAdminContact({client, workspaceURL}),
  ]);

  const isAdmin = Boolean(isPartnerUser) || Boolean(isAdminContactUser);

  const adminContact =
    partner?.isContact &&
    partner.contactWorkspaceConfigSet?.find(
      (c: any) =>
        c.portalWorkspace?.url === workspaceURL &&
        c?.partner?.id === user.mainPartnerId,
    )?.isAdmin;

  let role: Role = Role.user;
  if (adminContact) role = Role.admin;
  if (!partner?.isContact) role = Role.owner;

  return (
    <div className="flex-1 min-h-0 flex flex-col mb-20 lg:mb-0">
      <LayoutContent
        isAdmin={isAdmin}
        companyName={partner?.name ?? undefined}
        role={RoleLabel[role]}>
        {children}
      </LayoutContent>
    </div>
  );
}
