import React from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import type {Category} from '@/types';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from './mobile-menu-category';
import {findCategories} from './common/orm/categories';
import {getShopConfig} from './common/orm/config';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {workspaceURL, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  /* Access is gated per-page; the layout renders chrome only when access
     resolves and otherwise passes children through untouched. */
  if (!access.ok) return <div className="mb-20 lg:mb-4">{children}</div>;

  const {user} = access;
  const {client} = access.tenant;

  const config = await getShopConfig(access.workspace.config.id, client);
  const categories = config
    ? await findCategories(access.workspace.id, user, client).then(clone)
    : [];

  const parentcategories = (categories as Category[])?.filter(c => !c.parent);

  return (
    <div className="mb-20 lg:mb-4">
      {children}
      <MobileMenuCategory categories={parentcategories} />
    </div>
  );
}
