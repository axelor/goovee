import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {clone} from '@/utils';
import {DEFAULT_LIMIT, DEFAULT_PAGE, SUBAPP_CODES} from '@/constants';
import {PartnerKey} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {SplitViewListSkeleton} from '@/ui/components/record-skeleton';

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
  const access = await ensureAccess({
    code: SUBAPP_CODES.quotations,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user, subapp} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const {limit, page, search} = searchParams;

  const {role, isContactAdmin} = subapp;

  const searchTerm = search?.trim();

  const where = {
    ...getWhereClauseForEntity({
      user,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.CLIENT_PARTNER,
    }),
    ...(searchTerm ? {saleOrderSeq: {like: `%${searchTerm}%`}} : {}),
  };

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
    <Suspense fallback={<SplitViewListSkeleton />}>
      <Quotations params={params} searchParams={searchParams} />
    </Suspense>
  );
}
