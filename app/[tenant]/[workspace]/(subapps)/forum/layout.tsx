import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {MENU} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import MobileMenu from '@/subapps/forum/mobile-menu';

export default async function Layout(
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
    }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await getSession();

  const {workspaceURL, tenant} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.forum,
    url: workspace.url,
    user: session?.user,
    tenantId: tenant,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  return (
    <>
      {children}
      <MobileMenu items={MENU} />
    </>
  );
}
