import type {Client} from '@/goovee/.generated/client';
import type {SeedPartner} from './lookups';
import type {ContactSeed, ProfileSeed} from './validators';

/* Writes the directory fields onto an existing customer partner — and
 * nothing else. Visibility toggles default to shown. The optimistic-lock
 * `version` comes from the looked-up partner. */
export async function upsertDirectoryProfile(
  client: Client,
  partner: SeedPartner,
  profile: ProfileSeed,
) {
  return client.aOSPartner.update({
    data: {
      id: partner.id,
      version: partner.version,
      isInDirectory: true,
      portalCompanyName: profile.portalCompanyName,
      directoryCompanyDescription: profile.description,
      isEmailInDirectory: profile.showEmail ?? true,
      isPhoneInDirectory: profile.showPhone ?? true,
      isWebsiteInDirectory: profile.showWebsite ?? true,
      isAddressInDirectory: profile.showAddress ?? true,
    },
    select: {id: true},
  });
}

/* Pulls a partner back out of the directory: clears the directory-only
 * fields and turns the visibility flags off. Touches nothing else. */
export async function resetDirectoryProfile(
  client: Client,
  partner: SeedPartner,
) {
  return client.aOSPartner.update({
    data: {
      id: partner.id,
      version: partner.version,
      isInDirectory: false,
      directoryCompanyDescription: null,
      isEmailInDirectory: false,
      isPhoneInDirectory: false,
      isWebsiteInDirectory: false,
      isAddressInDirectory: false,
    },
    select: {id: true},
  });
}

/* Lists a contact in the directory and writes its demo LinkedIn link.
 * Only directory fields are touched; the contact's name, email, phone and
 * job title already live on the partner. Visibility toggles default to
 * shown. */
export async function upsertDirectoryContact(
  client: Client,
  partner: SeedPartner,
  contact: ContactSeed,
) {
  return client.aOSPartner.update({
    data: {
      id: partner.id,
      version: partner.version,
      isInDirectory: true,
      linkedinLink: contact.linkedinLink,
      isFunctionInDirectory: contact.showFunction ?? true,
      isEmailInDirectory: contact.showEmail ?? true,
      isPhoneInDirectory: contact.showPhone ?? true,
      isLinkedinInDirectory: contact.showLinkedin ?? true,
    },
    select: {id: true},
  });
}

/* Pulls a contact back out of the directory: flips the listing and its
 * visibility flags off. Leaves the LinkedIn link in place, mirroring how
 * the company reset leaves shared partner fields untouched. */
export async function resetDirectoryContact(
  client: Client,
  partner: SeedPartner,
) {
  return client.aOSPartner.update({
    data: {
      id: partner.id,
      version: partner.version,
      isInDirectory: false,
      isFunctionInDirectory: false,
      isEmailInDirectory: false,
      isPhoneInDirectory: false,
      isLinkedinInDirectory: false,
    },
    select: {id: true},
  });
}
