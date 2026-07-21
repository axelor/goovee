import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {findCategories} from '@/subapps/shop/common/orm/categories';

// Legacy route — the standalone category page was removed when the shop
// switched to the V3 unified catalog with a sidebar filter. We resolve the
// slug to a category id and redirect into the hub with the right ?cat=.
export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'category-slug': string}>;
}) {
  const params = await props.params;
  const slug = params['category-slug'];

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client} = access.tenant;

  const categories = await findCategories({
    workspace: access.workspace,
    client,
    user,
  }).then(clone);

  const match = (
    categories as Array<{id: string | number; slug?: string | null}>
  )?.find(c => c.slug === slug);

  if (!match) return redirect(`${workspaceURI}/shop`);
  return redirect(
    `${workspaceURI}/shop?cat=${encodeURIComponent(String(match.id))}`,
  );
}
