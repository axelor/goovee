import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import Content from './content';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {tenant} = params;
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  return <Content workspace={workspace} />;
}
