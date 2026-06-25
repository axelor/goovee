import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES, DEFAULT_LIMIT} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {TableSkeleton} from '@/ui/components/table';
import {PartnerKey} from '@/types';

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
  const {limit, page, type} = searchParams;
  const invoiceType = type ?? INVOICE.UNPAID;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.invoices,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
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

  const {user, client} = access;

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const workspace = clone({...access.workspace, config});

  const {role, isContactAdmin} = access.subapp;

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
