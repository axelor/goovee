import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone, getPartnerId} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findSubappAccess} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {PartnerKey, type Partner} from '@/types';
import {findDeliveryAddresses, findInvoicingAddresses} from '@/orm/address';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';

interface PageParams {
  params: Promise<{id: string; tenant: string; workspace: string}>;
  searchParams: Promise<{
    quotation?: string;
    checkout?: boolean;
    callbackURL?: string;
  }>;
}

async function fetchUser() {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return null;
  }
  return {user, session};
}

async function fetchQuotationData(
  quotationId: string,
  tenant: string,
  params: PageParams['params'],
  user: any,
) {
  const {workspaceURL} = workspacePathname(params);

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId: tenant,
  });

  if (!subapp) {
    return null;
  }

  const {role, isContactAdmin} = subapp;
  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation: any = await findQuotation({
    id: quotationId,
    tenantId: tenant,
    params: {where},
    workspaceURL,
  }).then(clone);

  if (!quotation) {
    return null;
  }

  return {
    recordId: quotation.id,
    address: {
      invoicingAddress: quotation.mainInvoicingAddress,
      deliveryAddress: quotation.deliveryAddress,
    },
  };
}

async function fetchAddresses(userId: Partner['id'], tenant: string) {
  const deliveryAddresses = await findDeliveryAddresses(userId, tenant).then(
    clone,
  );
  const invoicingAddresses = await findInvoicingAddresses(userId, tenant).then(
    clone,
  );

  return {deliveryAddresses, invoicingAddresses};
}

export default async function Page(props: PageParams) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {tenant} = params;
  const {
    quotation: quotationId = null,
    checkout = false,
    callbackURL,
  } = searchParams || {};

  const userSession = await fetchUser();
  if (!userSession) {
    return notFound();
  }
  const {user} = userSession;

  let data = {
    recordId: null,
    address: {invoicingAddress: null, deliveryAddress: null},
  };

  if (quotationId) {
    const quotation = await fetchQuotationData(
      quotationId,
      tenant,
      params,
      user,
    );
    if (!quotation) {
      return notFound();
    }
    data = quotation;
  }

  const userId = getPartnerId(user);

  const {deliveryAddresses, invoicingAddresses} = await fetchAddresses(
    userId,
    tenant,
  );

  const fromQuotation: boolean = !!quotationId;
  const fromCheckout: boolean = checkout;

  return (
    <Content
      quotation={{
        id: data.recordId,
        ...data.address,
      }}
      invoicingAddresses={invoicingAddresses}
      deliveryAddresses={deliveryAddresses}
      fromQuotation={fromQuotation}
      fromCheckout={fromCheckout}
      callbackURL={callbackURL}
    />
  );
}
