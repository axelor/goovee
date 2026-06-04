import type {SeedData} from './validators';

/* Cross-field validations that Zod can't express on its own. All
 * violations are collected and reported in one error so the author can
 * fix several rows in a single pass instead of fail-one-fix-one. */
export function validateCrossFieldRules(data: SeedData) {
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  for (const profile of data.profiles) {
    const email = profile.email.toLowerCase();
    if (seenEmails.has(email)) {
      errors.push(`Duplicate profile email '${profile.email}'.`);
    }
    seenEmails.add(email);
  }

  const seenContacts = new Set<string>();
  for (const contact of data.contacts ?? []) {
    const email = contact.email.toLowerCase();
    if (seenContacts.has(email)) {
      errors.push(`Duplicate contact email '${contact.email}'.`);
    }
    seenContacts.add(email);
  }

  if (errors.length) {
    const err = new Error(
      `Seed validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n  • ${errors.join('\n  • ')}`,
    );
    err.name = 'SeedValidationError';
    throw err;
  }
}
