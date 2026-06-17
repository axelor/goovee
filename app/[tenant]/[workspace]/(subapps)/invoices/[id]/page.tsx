import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {PartnerKey, type User} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {SignOutBanner} from './sign-out-banner';
import {TokenInvalid} from './token-invalid';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {InvoiceSkeleton} from '@/subapps/invoices/common/ui/components';

type Params = {id: string; tenant: string; workspace: string};
type SearchParams = {[key: string]: string | undefined};
type Session = Awaited<ReturnType<typeof getSession>>;

async function Invoice({
  params,
  searchParams,
  session,
}: {
  params: Params;
  searchParams: SearchParams;
  session: Session;
}) {
  const {id, tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;

  const token = searchParams.token;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  let user: User | undefined;

  if (!token) {
    user = session?.user;
  }
  if (!token && !user) return notFound();

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  let invoicesWhereClause = {};

  if (user) {
    const app = await findSubappAccess({
      code: SUBAPP_CODES.invoices,
      user: user,
      url: workspaceURL,
      client,
    });

    if (!app?.isInstalled) {
      return notFound();
    }

    const {role, isContactAdmin} = app;

    invoicesWhereClause = getWhereClauseForEntity({
      user,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
  }

  const invoice = await findInvoice({
    id,
    ...(token ? {token} : {params: {where: invoicesWhereClause}}),
    client,
    workspaceURL,
    tenantId,
  });

  if (!invoice) {
    if (token) return <TokenInvalid />;
    return notFound();
  }

  return (
    <Content
      invoice={clone(invoice)}
      workspace={workspace}
      workspaceURI={workspaceURI}
      token={token}
    />
  );
}

export default async function Page(props: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [params, searchParams, session] = await Promise.all([
    props.params,
    props.searchParams,
    getSession(),
  ]);
  const token = searchParams.token;
  const user = session?.user;
  if (token && user) {
    return <SignOutBanner userName={user.simpleFullName || user.name} />;
  }
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <Invoice params={params} searchParams={searchParams} session={session} />
    </Suspense>
  );
}
