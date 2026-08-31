/*
 * The process environment this deployment reads.
 *
 * Everything tenant- and deployment-scoped lives in the configuration document
 * instead; what is left is only how to find that document, and whether to serve
 * more than one of its entries. Read here rather than at each use so the same
 * value cannot be spelled two ways in two places — the proxy and the tenant
 * manager have to agree on the mode or they resolve different tenants for one
 * request.
 */

/**
 * A boolean setting, spelled `true` or `false`.
 *
 * @throws if the value is set to anything else — the alternative is reading
 *   every unrecognised spelling (`yes`, `1`, `TRUE`) as `false`, which starts
 *   the server in the opposite mode to the one that was asked for and reports
 *   nothing.
 */
function readFlag(name: string, value: string | undefined): boolean {
  if (value === undefined || value === '') return false;

  if (value !== 'true' && value !== 'false') {
    throw new Error(
      `${name} must be "true" or "false", got ${JSON.stringify(value)}`,
    );
  }

  return value === 'true';
}

/* Which entries of the document are servable. With this off only the default
 * entry is ever served, whatever else the document holds. */
export const isMultiTenancy = readFlag(
  'MULTI_TENANCY',
  process.env.MULTI_TENANCY,
);

/* Where the configuration document is: a path (preferred) or inline JSON.
 * Absence is not an error here — a production build evaluates module-init code
 * with no runtime environment present, so it is the read that decides. */
export const tenantsConfigFile = process.env.TENANTS_CONFIG_FILE;

export const tenantsConfigInline = process.env.TENANTS_CONFIG;
