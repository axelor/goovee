import type {AOSPartner} from '@/goovee/.generated/models';
import type {Payload, SelectOptions, WhereOptions} from '@goovee/orm';

export function getCompanyAccessFilter() {
  return {
    isInDirectory: true,
    isCustomer: true,
    OR: [{archived: false}, {archived: null}],
  } satisfies WhereOptions<AOSPartner>;
}

export function getContactAccessFilter() {
  return {
    isInDirectory: true,
    isContact: true,
    OR: [{archived: false}, {archived: null}],
  } satisfies WhereOptions<AOSPartner>;
}

/* The query results these helpers receive are projected (only the fields each
 * query selected), so each helper is constrained to the select-fragment of the
 * fields it reads rather than to the whole AOSPartner. A result that selected at
 * least those fields satisfies the constraint, and T preserves the caller's
 * exact shape through the return. */
const addressFields = {
  isAddressInDirectory: true,
  mainAddress: {id: true},
} as const satisfies SelectOptions<AOSPartner>;

const companyFields = {
  ...addressFields,
  isEmailInDirectory: true,
  emailAddress: {id: true},
  isPhoneInDirectory: true,
  fixedPhone: true,
  mobilePhone: true,
  isWebsiteInDirectory: true,
  webSite: true,
} as const satisfies SelectOptions<AOSPartner>;

const contactFields = {
  isFunctionInDirectory: true,
  jobTitleFunction: {id: true},
  isEmailInDirectory: true,
  emailAddress: {id: true},
  isPhoneInDirectory: true,
  fixedPhone: true,
  mobilePhone: true,
  isLinkedinInDirectory: true,
  linkedinLink: true,
} as const satisfies SelectOptions<AOSPartner>;

const entryFields = {
  ...companyFields,
  mainPartnerContacts: {select: contactFields},
} as const satisfies SelectOptions<AOSPartner>;

type MaskableAddress = Payload<AOSPartner, {select: typeof addressFields}>;
type MaskableCompany = Payload<AOSPartner, {select: typeof companyFields}>;
type MaskableContact = Payload<AOSPartner, {select: typeof contactFields}>;
type MaskableEntry = Payload<AOSPartner, {select: typeof entryFields}>;

export function maskAddressByAccess<T extends MaskableAddress>(partner: T): T {
  return {
    ...partner,
    mainAddress: partner.isAddressInDirectory ? partner.mainAddress : null,
  };
}

export function maskCompanyFieldsByAccess<T extends MaskableCompany>(
  company: T,
): T {
  return {
    ...maskAddressByAccess(company),
    emailAddress: company.isEmailInDirectory ? company.emailAddress : null,
    fixedPhone: company.isPhoneInDirectory ? company.fixedPhone : null,
    mobilePhone: company.isPhoneInDirectory ? company.mobilePhone : null,
    webSite: company.isWebsiteInDirectory ? company.webSite : null,
  };
}

export function maskContactFieldsByAccess<T extends MaskableContact>(
  contact: T,
): T {
  return {
    ...contact,
    jobTitleFunction: contact.isFunctionInDirectory
      ? contact.jobTitleFunction
      : null,
    emailAddress: contact.isEmailInDirectory ? contact.emailAddress : null,
    fixedPhone: contact.isPhoneInDirectory ? contact.fixedPhone : null,
    mobilePhone: contact.isPhoneInDirectory ? contact.mobilePhone : null,
    linkedinLink: contact.isLinkedinInDirectory ? contact.linkedinLink : null,
  };
}

export function maskEntryByAccess<T extends MaskableEntry>(entry: T): T {
  if (entry.mainPartnerContacts?.length) {
    entry.mainPartnerContacts = entry.mainPartnerContacts.map(contact =>
      maskContactFieldsByAccess(contact),
    );
  }
  return maskCompanyFieldsByAccess(entry);
}
