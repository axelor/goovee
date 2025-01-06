import React from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from './mobile-menu-category';
import {findCategories} from './common/orm/categories';

export async function generateMetadata() {
  return {
    title: await t('Shop'),
  };
}

export default async function Layout({
  params,
  children,
}: {
  params: {
    tenant: string;
    workspace: string;
  };
  children: React.ReactNode;
}) {
  const {tenant} = params;
  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.shop,
    url: workspace.url,
    user,
    tenantId: tenant,
  });

  if (!app?.installed) {
    return notFound();
  }

  const categories = await findCategories({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  const parentcategories = categories?.filter((c: any) => !c.parent);

  return (
    <>
      {children}
      <MobileMenuCategory categories={parentcategories} />
    </>
  );
}
