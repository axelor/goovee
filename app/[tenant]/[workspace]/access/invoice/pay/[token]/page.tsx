// ---- CORE IMPORTS ---- //
import {workspacePathname} from '@/utils/workspace';
import Content from './content';
import {findWorkspace} from '@/orm/workspace';
import {notFound} from 'next/navigation';
import {findInvoice} from '@/subapps/invoices/common/orm/invoices';
import {clone} from '@/utils';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; token: string}>;
}) {
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {token} = params;

  const workspace = await findWorkspace({
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) return notFound();

  const invoice = await findInvoice({
    token: token,
    workspaceURL,
    tenantId: tenant,
  });

  if (!invoice) {
    return notFound();
  }

  return (
    <Content
      invoice={clone(invoice)}
      workspaceURI={workspaceURI}
      token={token}
      workspace={workspace}
    />
  );
}
