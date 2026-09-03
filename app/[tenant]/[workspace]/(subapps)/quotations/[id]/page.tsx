import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {findSubappAccess} from '@/orm/workspace';
import {PartnerKey} from '@/types';
import {SUBAPP_CODES} from '@/constants';
import {getWhereClauseForEntity} from '@/utils/filters';
import {isCommentEnabled} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';
import {QuotationSkeleton} from '@/subapps/quotations/common/ui/components';
import type {QuotationDetail} from '@/subapps/quotations/common/types/quotations';
import {getQuotationsConfig} from '@/subapps/quotations/common/orm/config';

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
  const access = await ensureAccess({
    code: SUBAPP_CODES.quotations,
    allowGuest: false,
  });

  if (!access.ok) return denyPage(access);

  const {user, subapp} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const config = await getQuotationsConfig(access.workspace.config.id, client);
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
