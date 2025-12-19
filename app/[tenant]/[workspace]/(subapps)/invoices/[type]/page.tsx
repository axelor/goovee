import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES, DEFAULT_LIMIT} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {TableSkeleton} from '@/ui/components/table';
import {PartnerKey} from '@/types';

// ---- LOCAL IMPORTS ---- //
import Content from '@/app/[tenant]/[workspace]/(subapps)/invoices/[type]/content';
import {findInvoices} from '@/subapps/invoices/common/orm/invoices';
import {Suspense} from 'react';

async function Invoices({
  params,
  searchParams,
}: {
  params: {
    type: string;
    tenant: string;
    workspace: string;
  };
  searchParams: {[key: string]: string | undefined};
}) {
  const {type, tenant} = params;

  const {limit, page} = searchParams;

  const session = await getSession();

  if (!session) return notFound();

  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.invoices,
    url: workspace.url,
    user: user,
    tenantId: tenant,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const result: any = await findInvoices({
    params: {
      where: invoicesWhereClause,
      page,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    },
    type,
    tenantId: tenant,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {invoices, pageInfo} = result;

  return (
    <Content
      invoiceType={type}
      invoices={invoices}
      workspace={workspace}
      pageInfo={pageInfo}
    />
  );
}

export default async function Page(
  props: {
    params: Promise<{
      type: string;
      tenant: string;
      workspace: string;
    }>;
    searchParams: Promise<{[key: string]: string | undefined}>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Invoices params={params} searchParams={searchParams} />
    </Suspense>
  );
}
