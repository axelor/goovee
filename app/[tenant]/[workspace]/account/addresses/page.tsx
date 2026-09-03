import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone, getPartnerId} from '@/utils';
import {ensureWorkspaceAccess} from '@/lib/core/access/ensure-workspace-access';
import {findSubappAccess} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {PartnerKey} from '@/types';
import {
  findAddresses,
  findCountries,
  findDeliveryAddresses,
  findInvoicingAddresses,
} from '@/orm/address';
import {getWhereClauseForEntity} from '@/utils/filters';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';

// ---- LOCAL IMPORTS ---- //
import AddressesContent from './content';
import {AddressBook} from './common/ui/components';

interface PageParams {
  searchParams: Promise<{
    quotation?: string;
    checkout?: boolean;
    callbackURL?: string;
  }>;
}

export default async function Page(props: PageParams) {
  const searchParams = await props.searchParams;
  const {
    quotation: quotationId = null,
    checkout = false,
    callbackURL,
  } = searchParams || {};

  const access = await ensureWorkspaceAccess();
  if (!access.ok) return notFound();

  const {user, tenant} = access;
  const {client} = tenant;
  const workspaceURL = access.workspace.url;

  const userId = getPartnerId(user);

  const fromQuotation = !!quotationId;
  const fromCheckout = !!checkout;
  const standalone = !fromQuotation && !fromCheckout;

  // Standalone account tab → smart address book.
  if (standalone) {
    const [addresses, countries] = await Promise.all([
      findAddresses(userId, client).then(clone),
      findCountries(client).then(clone),
    ]);

    return (
      <AddressBook
        addresses={addresses || []}
        countries={(countries ?? []).map(c => ({id: c.id, name: c.name ?? ''}))}
      />
    );
  }

  // Checkout / quotation → existing address selection flow.
  let data: {
    recordId: string | null;
    address: {
      invoicingAddress: {id: string} | null;
      deliveryAddress: {id: string} | null;
    };
  } = {
    recordId: null,
    address: {invoicingAddress: null, deliveryAddress: null},
  };

  if (quotationId) {
    const subapp = await findSubappAccess({
      code: SUBAPP_CODES.quotations,
      user,
      url: workspaceURL,
      client,
    });
    if (subapp) {
      const {role, isContactAdmin} = subapp;
      const where = getWhereClauseForEntity({
        user,
        role,
        isContactAdmin,
        partnerKey: PartnerKey.CLIENT_PARTNER,
      });
      const quotation = await findQuotation({
        id: quotationId,
        client,
        params: {where},
        workspaceURL,
      }).then(clone);
      if (quotation) {
        data = {
          recordId: quotation.id,
          address: {
            invoicingAddress: quotation.mainInvoicingAddress,
            deliveryAddress: quotation.deliveryAddress,
          },
        };
      }
    }
  }

  const [deliveryAddresses, invoicingAddresses, countries] = await Promise.all([
    findDeliveryAddresses(userId, client).then(clone),
    findInvoicingAddresses(userId, client).then(clone),
    findCountries(client).then(clone),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AddressesContent
        quotation={{
          id: data.recordId,
          ...data.address,
        }}
        invoicingAddresses={invoicingAddresses ?? []}
        deliveryAddresses={deliveryAddresses ?? []}
        countries={(countries ?? []).map(c => ({id: c.id, name: c.name ?? ''}))}
        fromQuotation={fromQuotation}
        fromCheckout={fromCheckout}
        callbackURL={callbackURL}
      />
    </div>
  );
}
