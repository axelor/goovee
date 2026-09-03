import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {ensureTokenAccess} from '@/lib/core/access/ensure-token-access';
import {SUBAPP_CODES} from '@/constants';
import {currentWorkspace} from '@/lib/core/url/current';
import {PartnerKey} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';
import {canSettleStripeBankTransfer} from '@/lib/core/payment/stripe';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {SignOutBanner} from './sign-out-banner';
import {TokenInvalid} from './token-invalid';
import {getInvoicesConfig} from '@/subapps/invoices/common/orm/config';
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
  const {id} = params;
  const token = searchParams.token;

  /* Token path: a capability scoped to one invoice. ensureTokenAccess only
     establishes the workspace; the token is fused into findInvoice below, which
     is what actually authorizes this invoice. The workspace is named from the
     address the request arrived at, because there is no gate before it to
     resolve one. */
  if (token) {
    const scope = await currentWorkspace();
    if (!scope) notFound();

    const access = await ensureTokenAccess({
      url: scope.key(),
      tenantId: scope.tenantId,
      token,
    });
    if (!access.ok) notFound();

    const invoice = await findInvoice({
      id,
      token: access.token,
      client: access.tenant.client,
      workspaceURL: access.workspace.url,
      tenantId: access.tenant.id,
    });
    if (!invoice) return <TokenInvalid />;

    const config = await getInvoicesConfig(
      access.workspace.config.id,
      access.tenant.client,
    );
    if (!config) notFound();

    return (
      <Content
        invoice={clone(invoice)}
        config={clone(config)}
        token={access.token}
        allowStripeBankTransfer={canSettleStripeBankTransfer(
          access.tenant.config,
        )}
      />
    );
  }

  /* Session path: the visitor must be a logged-in user with access to the
     invoices app, and only sees invoices their partner owns. */
  const access = await ensureAccess({
    code: SUBAPP_CODES.invoices,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

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
    workspaceURL: access.workspace.url,
    tenantId: access.tenant.id,
  });
  if (!invoice) notFound();

  const config = await getInvoicesConfig(
    access.workspace.config.id,
    access.tenant.client,
  );
  if (!config) notFound();

  return (
    <Content
      invoice={clone(invoice)}
      config={clone(config)}
      allowStripeBankTransfer={canSettleStripeBankTransfer(
        access.tenant.config,
      )}
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
