import type {AOSPartner} from '@/goovee/.generated/models';
import type {WhereOptions} from '@goovee/orm';

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

export function maskCompanyFieldsByAccess<T extends AOSPartner>(company: T): T {
  return {
    ...company,
    mainAddress: company.isAddressInDirectory ? company.mainAddress : null,
    emailAddress: company.isEmailInDirectory ? company.emailAddress : null,
    fixedPhone: company.isPhoneInDirectory ? company.fixedPhone : null,
    mobilePhone: company.isPhoneInDirectory ? company.mobilePhone : null,
    webSite: company.isWebsiteInDirectory ? company.webSite : null,
  };
}

export function maskContactFieldsByAccess<T extends AOSPartner>(contact: T): T {
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

export function maskEntryByAccess<T extends AOSPartner>(entry: T): T {
  if (entry.mainPartnerContacts?.length) {
    entry.mainPartnerContacts = entry.mainPartnerContacts.map(contact =>
      maskContactFieldsByAccess(contact),
    );
  }
  return maskCompanyFieldsByAccess(entry);
}
