import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {workspacePathname} from '@/utils/workspace';
import {findSubappAccess, getWorkspaceConfig} from '@/orm/workspace';
import {PartnerKey} from '@/types';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {isCommentEnabled} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';
import {QuotationSkeleton} from '@/subapps/quotations/common/ui/components';
import type {QuotationDetail} from '@/subapps/quotations/common/types/quotations';

type PageProps = {
  params: Promise<{
    id: string;
    tenant: string;
    workspace: string;
  }>;
};
async function Quotation({params: paramsProm}: PageProps) {
  const params = await paramsProm;
  const {id} = params;

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

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.quotations,
    config,
  });

  const {role, isContactAdmin} = subapp;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id,
    client,
    params: {
      where,
    },
    workspaceURL,
  });

  if (!quotation) {
    return notFound();
  }

  const orderSubapp = await findSubappAccess({
    code: SUBAPP_CODES.orders,
    user,
    url: workspaceURL,
    client,
  });

  return (
    <Content
      quotation={clone(quotation) as QuotationDetail}
      enableComment={enableComment}
      orderSubapp={Boolean(orderSubapp)}
    />
  );
}

export default async function Page(props: PageProps) {
  return (
    <Suspense fallback={<QuotationSkeleton />}>
      <Quotation params={props.params} />
    </Suspense>
  );
}
