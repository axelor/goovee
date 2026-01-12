import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';

// ---- CORE IMPORRS ---- //
import {ADDRESS_TYPE, SUBAPP_PAGE} from '@/constants';
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findCountries} from '@/orm/address';
import {findGooveeUserByEmail, PartnerTypeMap} from '@/orm/partner';

// ---- LOCAL IMPORTS ---- //
import Content from './content';

export default async function Page(props: {params: Promise<any>}) {
  const params = await props.params;
  const {tenant, type} = params;

  const {workspaceURI} = workspacePathname(params);

  if (![ADDRESS_TYPE.invoicing, ADDRESS_TYPE.delivery].includes(type)) {
    redirect(`${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}`);
  }

  const session = await getSession();
  const user: any = session?.user;
  if (!user) {
    return notFound();
  }

  const partner = await findGooveeUserByEmail(user.email, tenant);

  if (!partner) {
    return notFound();
  }

  const {partnerTypeSelect} = partner;

  const userType: any = Object.entries(PartnerTypeMap).find(
    ([key, value]) => value === partnerTypeSelect,
  )?.[0];

  const countries: any = await findCountries(tenant).then(clone);

  return <Content type={type} countries={countries} userType={userType} />;
}
