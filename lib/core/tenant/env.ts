/*
 * The process environment this deployment reads.
 *
 * Everything tenant- and deployment-scoped lives in the configuration document,
 * so all that is left here is where to find it. The document also decides how
 * many tenants are served: every entry it names.
 */

/* Where the configuration document is: a path (preferred) or inline JSON.
 * Absence is not an error here — a production build evaluates module-init code
 * with no runtime environment present, so it is the read that decides. */
export const tenantsConfigFile = process.env.TENANTS_CONFIG_FILE;

export const tenantsConfigInline = process.env.TENANTS_CONFIG;
