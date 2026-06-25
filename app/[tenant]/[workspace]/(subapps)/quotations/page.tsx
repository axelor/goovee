import {notFound, redirect, unauthorized} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {clone} from '@/utils';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  SEARCH_PARAMS,
  SUBAPP_CODES,
} from '@/constants';
import {PartnerKey} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {TableSkeleton} from '@/ui/components/table';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import type {Quotation} from '@/subapps/quotations/common/types/quotations';
import {fetchQuotations} from '@/subapps/quotations/common/orm/quotations';

async function Quotations({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.quotations,
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

  const {user, subapp} = access;
  const {client} = access.tenant;

  const {limit, page} = searchParams;

  const {role, isContactAdmin} = subapp;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const queryParams = {
    where,
    page: page || DEFAULT_PAGE,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
  };

  const result = await fetchQuotations({
    params: queryParams,
    client,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {quotations, pageInfo} = result;

  return (
    <Content
      quotations={clone(quotations) as Quotation[]}
      pageInfo={pageInfo}
    />
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<TableSkeleton columnCount={3} rowCount={10} />}>
      <Quotations params={params} searchParams={searchParams} />
    </Suspense>
  );
}
