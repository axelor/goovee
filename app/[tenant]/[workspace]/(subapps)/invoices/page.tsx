import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {requireSubappAccess} from '@/lib/core/workspace/subapp-access';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES, DEFAULT_LIMIT} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {TableSkeleton} from '@/ui/components/table';
import {PartnerKey, User} from '@/types';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findInvoices} from '@/subapps/invoices/common/orm/invoices';
import type {InvoiceListItem} from '@/subapps/invoices/common/types/invoices';
import {INVOICE} from '@/subapps/invoices/common/constants/invoices';

async function Invoices({
  params,
  searchParams,
}: {
  params: {
    tenant: string;
    workspace: string;
  };
  searchParams: {[key: string]: string | undefined};
}) {
  const {tenant: tenantId} = params;
  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;
  const {limit, page, type} = searchParams;
  const invoiceType = type ?? INVOICE.UNPAID;

  const session = await getSession();

  const user = session?.user as User;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await requireSubappAccess({
    code: SUBAPP_CODES.invoices,
    url: workspace.url,
    user,
    client,
    workspaceURI,
    tenantId,
  });

  const {role, isContactAdmin} = app;

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const result = await findInvoices({
    params: {
      where: invoicesWhereClause,
      page,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    },
    type: invoiceType,
    client,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {invoices, pageInfo} = result;

  return (
    <Content
      invoiceType={invoiceType}
      invoices={clone(invoices) as InvoiceListItem[]}
      workspace={workspace}
      pageInfo={pageInfo}
    />
  );
}

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Invoices params={params} searchParams={searchParams} />
    </Suspense>
  );
}
