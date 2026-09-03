import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {findGooveeUserByEmail, isAdminContact, isPartner} from '@/orm/partner';

// ---- LOCAL IMPORTS ---- //
import LayoutContent from './layout-content';
import {RoleLabel} from './common/constants';
import {Role} from './common/types';

export default async function Layout(props: {children: React.ReactNode}) {
  const {children} = props;

  const access = await ensureAccess();
  if (!access.ok) return notFound();

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.workspace.url;

  const [partner, isPartnerUser, isAdminContactUser] = await Promise.all([
    findGooveeUserByEmail(user.email, client),
    isPartner(),
    isAdminContact({client, workspaceURL}),
  ]);

  const isAdmin = Boolean(isPartnerUser) || Boolean(isAdminContactUser);

  const adminContact =
    partner?.isContact &&
    partner.contactWorkspaceConfigSet?.find(
      c =>
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
