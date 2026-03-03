import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {ROUTES} from './common/constants';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);

  redirect(`${workspaceURI}/account/${ROUTES.personal}`);
}
