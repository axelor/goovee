import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {clone} from '@/utils';
import {DEFAULT_LIMIT, DEFAULT_PAGE, SUBAPP_CODES} from '@/constants';
import {PartnerKey, type User} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {TableSkeleton} from '@/ui/components/table';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {fetchQuotations} from '@/subapps/quotations/common/orm/quotations';
import {Suspense} from 'react';

async function Quotations({
  params,
  searchParams,
}: {
  params: {tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {tenant} = params;
  const session = await getSession();

  const user = session?.user as User;

  if (!user) {
    return notFound();
  }

  const {limit, page} = searchParams;

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.quotations,
    url: workspace.url,
    user: session?.user,
    tenantId: tenant,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

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

  const result: any = await fetchQuotations({
    params: queryParams,
    tenantId: tenant,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {quotations, pageInfo} = result;

  return <Content quotations={clone(quotations)} pageInfo={pageInfo} />;
}

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
    searchParams: Promise<{[key: string]: string | undefined}>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<TableSkeleton columnCount={3} rowCount={10} />}>
      <Quotations params={params} searchParams={searchParams} />
    </Suspense>
  );
}
