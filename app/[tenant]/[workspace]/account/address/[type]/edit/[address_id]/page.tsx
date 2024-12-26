import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';

// ---- CORE IMPORRS ---- //
import {ADDRESS_TYPE, SUBAPP_PAGE} from '@/constants';
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {findCountries, findPartnerAddress} from '@/orm/address';
import {findPartnerByEmail, PartnerTypeMap} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import Content from './content';

export default async function Page({
  params,
}: {
  params: {
    id: string;
    tenant: string;
    workspace: string;
    type: ADDRESS_TYPE;
    address_id: string;
  };
}) {
  const {tenant, type, address_id} = params;
  const {workspaceURI} = workspacePathname(params);

  const REDIRECT_ADDRESS_URL = `${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.address}`;

  if (![ADDRESS_TYPE.invoicing, ADDRESS_TYPE.delivery].includes(type)) {
    redirect(`${REDIRECT_ADDRESS_URL}`);
  }

  const session = await getSession();
  const user: any = session?.user;
  if (!user) {
    return notFound();
  }

  const partner = await findPartnerByEmail(user.email, tenant);

  if (!partner) {
    return notFound();
  }

  const {partnerTypeSelect} = partner;

  const userType: any = Object.entries(PartnerTypeMap).find(
    ([key, value]) => value === partnerTypeSelect,
  )?.[0];

  const countries: any = await findCountries(tenant).then(clone);

  const partnerAddress = await findPartnerAddress(address_id, tenant).then(
    clone,
  );

  if (!partnerAddress) {
    redirect(`${REDIRECT_ADDRESS_URL}`);
  }

  return (
    <Content
      type={type}
      address={partnerAddress.address}
      countries={countries}
      userType={userType}
    />
  );
}
