import {z} from 'zod';

/* Source of truth for the directory seed payload. Runtime validation uses
 * these Zod schemas; the matching `seed.schema.json` is a hand-derived
 * JSON Schema purely for editor / IDE support inside `seed.json`. If you
 * change a schema here, update the JSON Schema too. */

export const ProfileSchema = z
  .object({
    /* Upsert key — the customer account to list in the directory. The
     * seeder skips it when no AOSPartner with this email exists, or when
     * that partner is not a customer. */
    email: z.email(),
    /* Heading shown on the directory card and detail page
     * (AOSPartner.portalCompanyName). */
    portalCompanyName: z.string().min(1),
    /* Rich-text HTML stored on AOSPartner.directoryCompanyDescription. */
    description: z.string().min(1),
    /* Per-field visibility toggles, default to shown. They only expose
     * data already on the partner (email, phone, website, address); the
     * seed never writes that underlying contact data itself. */
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showWebsite: z.boolean().optional(),
    showAddress: z.boolean().optional(),
  })
  .strict();
export type ProfileSeed = z.infer<typeof ProfileSchema>;

export const ContactSchema = z
  .object({
    /* Upsert key — the contact account to list under its company. The
     * seeder skips it when no partner with this email exists, or the
     * partner is not a contact. */
    email: z.email(),
    /* Demo LinkedIn URL written to AOSPartner.linkedinLink. The contact's
     * other details (name, email, phone, job title) already live on the
     * partner — only the LinkedIn link is authored here. */
    linkedinLink: z.httpUrl(),
    /* Per-field visibility toggles, default to shown. */
    showFunction: z.boolean().optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showLinkedin: z.boolean().optional(),
  })
  .strict();
export type ContactSeed = z.infer<typeof ContactSchema>;

export const SeedSchema = z
  .object({
    /* IDE-only pointer to the JSON Schema for editor autocomplete; the
     * Zod runtime ignores it but `.strict()` would otherwise reject it. */
    $schema: z.string().optional(),
    profiles: z.array(ProfileSchema).min(1),
    contacts: z.array(ContactSchema).optional(),
  })
  .strict();
export type SeedData = z.infer<typeof SeedSchema>;
