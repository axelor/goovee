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
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {InvoiceSkeleton} from '@/subapps/invoices/common/ui/components';

async function Invoice({
  params,
  token,
}: {
  params: {id: string; tenant: string; workspace: string};
  token?: string;
}) {
  const {id, tenant} = params;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  let user: User | undefined;

  if (!token) {
    const session = await getSession();
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
    ...(token ? {token} : {id, params: {where: invoicesWhereClause}}),
    tenantId: tenant,
    workspaceURL,
  });

  if (!invoice) {
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
  params: Promise<{
    id: string;
    tenant: string;
    workspace: string;
  }>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const token = searchParams.token;
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <Invoice params={params} token={token} />
    </Suspense>
  );
}
