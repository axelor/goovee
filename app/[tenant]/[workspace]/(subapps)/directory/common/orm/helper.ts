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

/* Masking is a privacy guard, so it must fail safe: a gated value may appear in
 * a result only if its access flag was also selected, so the mask can null it
 * when the partner has not opted in. `Gated` enforces that per field at compile
 * time — selecting `emailAddress` without `isEmailInDirectory` is an error, not
 * a silent leak. Selecting neither value nor flag is fine. */
type Gated<T, Value extends string, Flag extends string> = Value extends keyof T
  ? Record<Flag, boolean | null>
  : unknown;

/* Null `valueKey` unless `flagKey` is truthy. A no-op when the value was not
 * selected; the caller's constraint guarantees the flag is present whenever the
 * value is, and a missing flag fails closed (value hidden). */
function applyGate<T extends object>(
  record: T,
  valueKey: string,
  flagKey: string,
): T {
  if (!(valueKey in record)) return record;
  const optedIn = (record as Record<string, unknown>)[flagKey];
  if (optedIn) return record;
  return {...record, [valueKey]: null} as T;
}

type CompanyGated<T> = Gated<T, 'mainAddress', 'isAddressInDirectory'> &
  Gated<T, 'emailAddress', 'isEmailInDirectory'> &
  Gated<T, 'fixedPhone', 'isPhoneInDirectory'> &
  Gated<T, 'mobilePhone', 'isPhoneInDirectory'> &
  Gated<T, 'webSite', 'isWebsiteInDirectory'>;

type ContactGated<T> = Gated<T, 'jobTitleFunction', 'isFunctionInDirectory'> &
  Gated<T, 'emailAddress', 'isEmailInDirectory'> &
  Gated<T, 'fixedPhone', 'isPhoneInDirectory'> &
  Gated<T, 'mobilePhone', 'isPhoneInDirectory'> &
  Gated<T, 'linkedinLink', 'isLinkedinInDirectory'>;

export function maskCompanyFieldsByAccess<T extends object & CompanyGated<T>>(
  company: T,
): T {
  let masked = applyGate(company, 'mainAddress', 'isAddressInDirectory');
  masked = applyGate(masked, 'emailAddress', 'isEmailInDirectory');
  masked = applyGate(masked, 'fixedPhone', 'isPhoneInDirectory');
  masked = applyGate(masked, 'mobilePhone', 'isPhoneInDirectory');
  masked = applyGate(masked, 'webSite', 'isWebsiteInDirectory');
  return masked;
}

export function maskContactFieldsByAccess<T extends object & ContactGated<T>>(
  contact: T,
): T {
  let masked = applyGate(contact, 'jobTitleFunction', 'isFunctionInDirectory');
  masked = applyGate(masked, 'emailAddress', 'isEmailInDirectory');
  masked = applyGate(masked, 'fixedPhone', 'isPhoneInDirectory');
  masked = applyGate(masked, 'mobilePhone', 'isPhoneInDirectory');
  masked = applyGate(masked, 'linkedinLink', 'isLinkedinInDirectory');
  return masked;
}

export function maskEntryByAccess<
  Contact extends object & ContactGated<Contact>,
  T extends object & CompanyGated<T>,
>(
  entry: T & {mainPartnerContacts?: Contact[] | null},
): T & {mainPartnerContacts?: Contact[] | null} {
  if (entry.mainPartnerContacts?.length) {
    entry.mainPartnerContacts = entry.mainPartnerContacts.map(
      maskContactFieldsByAccess,
    );
  }
  return maskCompanyFieldsByAccess(entry);
}
