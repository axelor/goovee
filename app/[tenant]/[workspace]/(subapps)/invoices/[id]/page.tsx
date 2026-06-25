import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {ensureTokenAuth} from '@/lib/core/access/ensure-token-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {PartnerKey} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {SignOutBanner} from './sign-out-banner';
import {TokenInvalid} from './token-invalid';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {InvoiceSkeleton} from '@/subapps/invoices/common/ui/components';

type Params = {id: string; tenant: string; workspace: string};
type SearchParams = {[key: string]: string | undefined};

async function Invoice({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const {id, tenant} = params;
  const token = searchParams.token;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  /* Token path: a capability scoped to one invoice. ensureTokenAuth only
     establishes the workspace; the token is fused into findInvoice below, which
     is what actually authorizes this invoice. */
  if (token) {
    const access = await ensureTokenAuth({
      url: workspaceURL,
      tenantId: tenant,
      token,
    });
    if (!access.ok) notFound();

    const invoice = await findInvoice({
      id,
      token: access.token,
      client: access.tenant.client,
      workspaceURL,
    });
    if (!invoice) return <TokenInvalid />;

    const config = await getWorkspaceConfig(
      access.workspace.config.id,
      access.tenant.client,
    );
    if (!config) notFound();

    return (
      <Content
        invoice={clone(invoice)}
        workspace={clone({...access.workspace, config})}
        workspaceURI={workspaceURI}
        token={access.token}
      />
    );
  }

  /* Session path: the visitor must be a logged-in user with access to the
     invoices app, and only sees invoices their partner owns. */
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

  const invoicesWhereClause = getWhereClauseForEntity({
    user: access.user,
    role: access.subapp.role,
    isContactAdmin: access.subapp.isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const invoice = await findInvoice({
    id,
    params: {where: invoicesWhereClause},
    client: access.tenant.client,
    workspaceURL,
  });
  if (!invoice) notFound();

  const config = await getWorkspaceConfig(
    access.workspace.config.id,
    access.tenant.client,
  );
  if (!config) notFound();

  return (
    <Content
      invoice={clone(invoice)}
      workspace={clone({...access.workspace, config})}
      workspaceURI={workspaceURI}
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
      <Invoice params={params} searchParams={searchParams} />
    </Suspense>
  );
}
