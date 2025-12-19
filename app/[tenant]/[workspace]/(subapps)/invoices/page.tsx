import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {workspaceURL} = workspacePathname(params);

  return redirect(
    `${workspaceURL}/${SUBAPP_CODES.invoices}/${SUBAPP_PAGE.unpaid}`,
  );
}
