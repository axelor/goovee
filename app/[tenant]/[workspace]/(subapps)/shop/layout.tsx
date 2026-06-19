import React from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';
import type {Category} from '@/types';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from './mobile-menu-category';
import {findCategories} from './common/orm/categories';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {tenant: tenantId} = params;
  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  await requireSubappAccess({
    code: SUBAPP_CODES.shop,
    url: workspace.url,
    user,
    client,
    workspaceURI,
    tenantId,
  });

  const categories = await findCategories({
    workspace,
    client,
    user,
  }).then(clone);

  const parentcategories = (categories as Category[])?.filter(c => !c.parent);

  return (
    <div className="mb-20 lg:mb-4">
      {children}
      <MobileMenuCategory categories={parentcategories} />
    </div>
  );
}
