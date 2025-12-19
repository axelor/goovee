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
}: {
  params: {id: string; type: string; tenant: string; workspace: string};
}) {
  const {type, id, tenant} = params;
  const {workspaceURL} = workspacePathname(params);

  const session = await getSession();

  if (!session) return notFound();

  const user = session?.user as User;

  if (!user) {
    return notFound();
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubappAccess({
    code: SUBAPP_CODES.invoices,
    user,
    url: workspacePathname(params)?.workspaceURL,
    tenantId: tenant,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const invoice = await findInvoice({
    id,
    type,
    params: {
      where: invoicesWhereClause,
    },
    tenantId: tenant,
    workspaceURL,
  });

  if (!invoice) {
    return notFound();
  }

  return (
    <Content
      invoiceType={type}
      invoice={clone(invoice)}
      workspace={workspace}
    />
  );
}

export default async function Page(
  props: {
    params: Promise<{id: string; type: string; tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <Invoice params={params} />
    </Suspense>
  );
}
