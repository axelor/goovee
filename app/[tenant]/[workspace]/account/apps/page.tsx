import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, findSubapps} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import Content from './content';

export default async function Account(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {tenant} = params;
  const session = await getSession();

  if (!session) return notFound();

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const subapps = await findSubapps({
    url: workspace.url,
    user: session?.user,
    tenantId: tenant,
  });

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <Content subapps={subapps} />
    </div>
  );
}
