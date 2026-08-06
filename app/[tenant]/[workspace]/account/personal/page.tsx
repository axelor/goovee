import {notFound} from 'next/navigation';
import {uniqBy} from 'lodash-es';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {PartnerTypeMap, findGooveeUserByEmail} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/lib/core/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {Role} from '../common/types';
import {SectionHeader} from '../common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const partner = await findGooveeUserByEmail(user.email, client);

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
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Account')}
        title={await t('Personal settings')}
        description={await t(
          'Company information shown across your workspace.',
        )}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <Form settings={settings as any} partners={partners} />
      </div>
    </div>
  );
}
