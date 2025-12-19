import React, {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {PartnerKey, type User} from '@/types';
import {SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';
import {QuotationSkeleton} from '@/subapps/quotations/common/ui/components';

type PageProps = {
  params: Promise<{
    id: any;
    tenant: string;
    workspace: string;
  }>;
};
async function Quotation({params}: PageProps) {
  const {id, tenant} = params;

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

  if (!workspace) return notFound();

  const app = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  const {role, isContactAdmin} = app;

  const where = getWhereClauseForEntity({
    user: user as User,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id,
    tenantId: tenant,
    params: {
      where,
    },
    workspaceURL,
  });

  if (!quotation) {
    return notFound();
  }

  const orderSubapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  return (
    <Content
      quotation={clone(quotation)}
      workspace={workspace}
      orderSubapp={Boolean(orderSubapp)}
    />
  );
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <Suspense fallback={<QuotationSkeleton />}>
      <Quotation params={params} />
    </Suspense>
  );
}
