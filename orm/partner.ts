import type {CreateArgs, SelectOptions} from '@goovee/orm';
import {getSession} from '@/auth';
import {UserType} from '@/auth/types';
import {hash} from '@/auth/utils';
import {manager, type Tenant} from '@/tenant';
import {USER_CREATED_FROM} from '@/constants';
import {clone} from '@/utils';
import {ID, Localization, Partner, PortalWorkspace} from '@/types';
import {
  findContactWorkspaceConfig,
  findDefaultPartnerWorkspaceConfig,
} from './workspace';
import type {AOSPartner} from '@/goovee/.generated/models';

const partnerFields = {
  firstName: true,
  fullName: true,
  simpleFullName: true,
  fixedPhone: true,
  mobilePhone: true,
  isContact: true,
  name: true,
  password: true,
  emailAddress: {address: true},
  picture: {id: true},
  mainPartner: {
    id: true,
    simpleFullName: true,
    partnerAddressList: {
      select: {
        isInvoicingAddr: true,
        isDefaultAddr: true,
        address: {formattedFullName: true},
      },
    },
  },
  partnerCategory: {
    name: true,
    code: true,
  },
  defaultWorkspace: {
    workspace: {
      id: true,
    },
  },
  partnerWorkspaceSet: {
    select: {
      workspace: {
        id: true,
      },
    },
  },
  contactWorkspaceConfigSet: {
    select: {
      portalWorkspace: {
        id: true,
        url: true,
      },
      isAdmin: true,
      partner: {id: true, name: true},
    },
  },
  localization: {
    code: true,
    name: true,
  },
  partnerTypeSelect: true,
  registrationCode: true,
  isAllowedToRegister: true,
  isActivatedOnPortal: true,
  createdFromSelect: true,
  canSubscribeNoPublicEvent: true,
  partnerAddressList: {
    select: {
      isInvoicingAddr: true,
      isDefaultAddr: true,
      address: {formattedFullName: true},
    },
  },
} satisfies SelectOptions<AOSPartner>;

export async function findPartnerById(
  id: ID,
  tenantId: Tenant['id'],
  params?: any,
) {
  if (!(id && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  const partner = await client.aOSPartner
    .findOne({
      where: {
        id,
        ...params?.where,
      },
      select: partnerFields,
    })
    .then(clone);

  return partner;
}

export async function isPartner() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return false;
  }

  if (user.isContact) {
    return false;
  }

  return user;
}

export async function isAdminContact({
  workspaceURL,
  tenantId,
}: {
  workspaceURL: PortalWorkspace['url'];
  tenantId: Tenant['id'];
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return false;
  }

  if (!user?.isContact) {
    return false;
  }

  const contactWorkspaceConfig = await findContactWorkspaceConfig({
    tenantId,
    url: workspaceURL,
    contactId: user.id,
    partnerId: user.mainPartnerId!,
  });

  if (!contactWorkspaceConfig?.isAdmin) {
    return false;
  }

  return user;
}

export async function findEmailAddress(email: string, tenantId: Tenant['id']) {
  if (!(email && tenantId)) {
    return null;
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return null;
  }

  return client.aOSEmailAddress.findOne({
    where: {
      address: email,
    },
    select: {id: true},
  });
}

export async function findGooveeUserByEmail(
  email: string,
  tenantId: Tenant['id'],
) {
  return findPartnerByEmail(email, tenantId, {
    where: {
      isActivatedOnPortal: {
        eq: true,
      },
    },
  });
}

export async function findContactByEmail(
  email: string,
  tenantId: Tenant['id'],
) {
  return findPartnerByEmail(email, tenantId, {
    where: {
      isContact: {
        eq: true,
      },
    },
  });
}

export async function findContactById(
  id: Partner['id'],
  tenantId: Tenant['id'],
) {
  return findPartnerById(id, tenantId, {
    where: {
      isContact: {
        eq: true,
      },
    },
  });
}

export async function findPartnerByEmail(
  email: string,
  tenantId: Tenant['id'],
  params?: any,
) {
  if (!(email && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  const partner = await client.aOSPartner
    .findOne({
      where: {
        emailAddress: {
          address: {
            eq: email,
          },
        },
        ...params?.where,
      },
      select: partnerFields,
    })
    .then(clone);

  return partner;
}

export async function updatePartner({
  data,
  tenantId,
}: {
  data: {id: Partner['id']; version: Partner['version']} & Partial<AOSPartner>;
  tenantId: Tenant['id'];
}) {
  if (!(data && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  if (!(data?.id && data?.version)) return null;

  const partner = await client.aOSPartner
    .update({
      data: {
        ...data,
        id: String(data.id),
      },
      select: {id: true},
    })
    .then(clone);

  return partner;
}

export async function registerContact({
  name,
  firstName,
  email,
  password,
  tenantId,
  contactConfig,
  partnerId,
  localizationId,
}: {
  name: string;
  firstName?: string;
  email: string;
  password?: string;
  tenantId: Tenant['id'];
  contactConfig?: any;
  partnerId: string;
  localizationId?: Localization['id'];
}) {
  if (!(name && email && tenantId && partnerId)) {
    return null;
  }

  const client = await manager.getClient(tenantId);

  if (!client) return null;

  const hashedPassword = password && (await hash(password));

  const mainPartner = await client.aOSPartner.findOne({
    where: {id: partnerId},
    select: {id: true, version: true, companySet: {select: {id: true}}},
  });

  if (!mainPartner) {
    return null;
  }

  const companySet = mainPartner.companySet?.map(c => ({id: c.id}));

  const data: any = {
    partnerTypeSelect: PartnerTypeMap[UserType.individual],
    firstName,
    name,
    mainPartner: {
      select: {
        id: partnerId,
      },
    },
    ...(!!companySet?.length && {
      companySet: {select: companySet},
    }),
    password: hashedPassword,
    isContact: true,
    isCustomer: true,
    fullName: `${name} ${firstName || ''}`,
    simpleFullName: `${name} ${firstName || ''}`,
    createdFromSelect: USER_CREATED_FROM,
    isActivatedOnPortal: true,
    emailAddress: {
      create: {
        address: email,
        name: email,
      },
    },
    localization: localizationId ? {select: {id: localizationId}} : undefined,
  } satisfies CreateArgs<AOSPartner>;

  if (contactConfig?.id) {
    data.contactWorkspaceConfigSet = {select: [{id: contactConfig.id}]};
    data.defaultWorkspace = {select: [{id: contactConfig.id}]};
  }

  const contact = await client.aOSPartner
    .create({data, select: {id: true}})
    .then(clone);
  await client.aOSPartner.update({
    data: {
      id: mainPartner.id,
      version: mainPartner.version,
      contactPartnerSet: {select: {id: contact.id}},
    },
    select: {id: true},
  });
  return contact;
}

export const PartnerTypeMap = {
  [UserType.company]: 1,
  [UserType.individual]: 2,
};

export async function registerPartner({
  type = UserType.individual,
  companyName,
  identificationNumber,
  companyNumber,
  firstName,
  name,
  password = '',
  email,
  workspaceURL,
  tenantId,
  isContact,
  localizationId,
}: {
  type: UserType;
  companyName?: string;
  identificationNumber?: string;
  companyNumber?: string;
  firstName?: string;
  name: string;
  password?: string;
  email: string;
  workspaceURL?: string;
  tenantId: Tenant['id'];
  isContact?: boolean;
  localizationId?: Localization['id'];
}) {
  const client = await manager.getClient(tenantId);

  const hashedPassword = await hash(password);

  const isCompany = type === UserType.company;
  const partnerTypeSelect =
    PartnerTypeMap[type] || PartnerTypeMap[UserType.individual];

  const $name = isCompany ? companyName : name;

  const data: any = {
    partnerTypeSelect,
    registrationCode: identificationNumber,
    fixedPhone: companyNumber,
    firstName,
    name: $name,
    password: hashedPassword,
    isContact: isContact || false,
    isCustomer: true,
    fullName: `${$name} ${firstName || ''}`,
    simpleFullName: `${$name} ${firstName || ''}`,
    createdFromSelect: USER_CREATED_FROM,
    isActivatedOnPortal: true,
    emailAddress: {
      create: {
        address: email,
        name: email,
      },
    },
    localization: localizationId ? {select: {id: localizationId}} : null,
  };

  if (workspaceURL) {
    const defaultPartnerWorkspaceConfig =
      await findDefaultPartnerWorkspaceConfig({url: workspaceURL, tenantId});

    const id = defaultPartnerWorkspaceConfig?.id;

    if (id) {
      data.partnerWorkspaceSet = {select: [{id}]};
      data.defaultWorkspace = {select: [{id}]};
    }
  }

  const existingPartner = await findPartnerByEmail(email, tenantId);

  if (existingPartner && !existingPartner.isActivatedOnPortal) {
    const {id, version} = existingPartner;
    const udpatedPartner = await client.aOSPartner.update({
      data: {
        ...data,
        id,
        version,
      },
      select: {id: true},
    });

    return udpatedPartner;
  }

  const partner = await client.aOSPartner
    .create({data, select: {id: true}})
    .then(clone);
  return partner;
}
