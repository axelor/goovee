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
  const {id, tenant} = params;
  const token = searchParams.token;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  let user: User | undefined;

  if (!token) {
    user = session?.user as User;
    if (!user) return notFound();
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  let invoicesWhereClause = {};

  if (!token) {
    const app = await findSubappAccess({
      code: SUBAPP_CODES.invoices,
      user: user!,
      url: workspaceURL,
      tenantId: tenant,
    });

    if (!app?.isInstalled) {
      return notFound();
    }

    const {role, isContactAdmin} = app;

    invoicesWhereClause = getWhereClauseForEntity({
      user: user!,
      role,
      isContactAdmin,
      partnerKey: PartnerKey.PARTNER,
    });
  }

  const invoice = await findInvoice({
    id,
    ...(token ? {token} : {params: {where: invoicesWhereClause}}),
    tenantId: tenant,
    workspaceURL,
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
