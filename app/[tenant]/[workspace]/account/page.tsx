import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {ROUTES} from './common/constants';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);

  redirect(`${workspaceURL}/account/${ROUTES.personal}`);
}
