import {notFound} from 'next/navigation';
import uniqBy from 'lodash/uniqBy';

// ---- CORE IMPORT ---- //
import {getSession} from '@/auth';
import {PartnerTypeMap, findGooveeUserByEmail} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORT ---- //
import Form from './form';
import {Role} from '../common/types';

export default async function Page({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant, workspaceURL} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const partner = await findGooveeUserByEmail(user.email, tenant);

  if (!partner) {
    return notFound();
  }

  const {
    partnerTypeSelect,
    name,
    registrationCode,
    fixedPhone,
    firstName,
    emailAddress,
    picture,
    fullName,
  } = partner;

  const isPartner = !partner.isContact;

  const isAdminContact =
    partner.isContact &&
    partner.contactWorkspaceConfigSet?.find(
      (c: any) =>
        c.portalWorkspace?.url === workspaceURL &&
        c?.partner?.id === user.mainPartnerId,
    )?.isAdmin;

  let role: Role = Role.user;

  if (isAdminContact) {
    role = Role.admin;
  }

  if (isPartner) {
    role = Role.owner;
  }

  const type = Object.entries(PartnerTypeMap).find(
    ([key, value]) => value === partnerTypeSelect,
  )?.[0];

  let partners =
    (partner.isContact &&
      partner.contactWorkspaceConfigSet
        ?.map(config => config.partner)
        ?.filter(Boolean)
        ?.map((partner: any) => ({
          id: partner.id?.toString(),
          name: partner.name,
        }))) ||
    [];

  partners = uniqBy(partners, 'id');

  const settings = {
    type,
    companyName: name,
    identificationNumber: registrationCode,
    companyNumber: fixedPhone,
    firstName,
    name,
    email: emailAddress?.address,
    picture: picture?.id,
    fullName,
    role,
    mainPartner: user.mainPartnerId?.toString(),
    linkedinLink: partner.linkedinLink,
  };

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <Form settings={settings as any} partners={partners} />
    </div>
  );
}
