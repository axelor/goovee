import type {Client} from '@/goovee/.generated/client';

/* Fail-fast lookups for the marketplace seed. Each helper throws a
 * clear error when the prerequisite row is missing, listing existing
 * values so the JSON file can be corrected without DB spelunking. */

class SeedLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedLookupError';
  }
}

/* Resolves the workspace AND its marketplace pricing defaults by walking
 * AOSPortalWorkspace → defaultPartnerWorkspace → portalAppConfig. The
 * defaults (unit, productFamily) are read once here and then stamped onto
 * every seeded product, mirroring `saveProduct` in the app. The product
 * currency is resolved per-supplier in run.ts (partner currency, falling
 * back to DEFAULT_CURRENCY_CODE) — there is no workspace-level default. */
export async function findWorkspaceByUrl(client: Client, url: string) {
  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url},
    select: {
      id: true,
      name: true,
      url: true,
      defaultPartnerWorkspace: {
        id: true,
        portalAppConfig: {
          id: true,
          marketplaceDefaultUnit: {id: true, name: true},
          marketplaceDefaultProductFamily: {id: true, code: true},
          marketplaceInAti: true,
          company: {id: true, name: true, timezone: true},
        },
      },
    },
  });
  if (!workspace) {
    const existing = await client.aOSPortalWorkspace.find({
      select: {url: true},
    });
    throw new SeedLookupError(
      `Workspace '${url}' not found. Existing: ${existing.map(w => w.url).join(', ')}`,
    );
  }
  const config = workspace.defaultPartnerWorkspace?.portalAppConfig;
  if (
    !config?.marketplaceDefaultUnit?.id ||
    !config?.marketplaceDefaultProductFamily?.id
  ) {
    throw new SeedLookupError(
      `Workspace '${url}' is missing marketplace pricing defaults. Set marketplaceDefaultUnit and marketplaceDefaultProductFamily on its PortalAppConfig.`,
    );
  }
  return {...workspace, config};
}

/* Resolves an AOSCurrency by its ISO code. Used for the fallback when a
 * supplier partner has no `currency` set. */
export async function findCurrencyByCode(client: Client, code: string) {
  const currency = await client.aOSCurrency.findOne({
    where: {code},
    select: {id: true, code: true, symbol: true, numberOfDecimals: true},
  });
  if (!currency) {
    throw new SeedLookupError(
      `AOSCurrency with code '${code}' not found. Create it in AOS or change the fallback in @/constants.`,
    );
  }
  return currency;
}

/* Resolves the partner currencies for a batch of supplier ids. Returns
 * a Map<partnerId, currencyId | null>; partners without a currency get
 * null and will fall back to DEFAULT_CURRENCY_CODE at the call site. */
export async function findPartnerCurrencies(
  client: Client,
  partnerIds: string[],
) {
  if (!partnerIds.length) return new Map<string, string | null>();
  const partners = await client.aOSPartner.find({
    where: {id: {in: partnerIds}},
    select: {id: true, currency: {id: true}},
  });
  return new Map(partners.map(p => [p.id, p.currency?.id ?? null]));
}

export async function findPartnerByEmail(client: Client, email: string) {
  const partner = await client.aOSPartner.findOne({
    where: {emailAddress: {address: email}},
    select: {id: true, name: true, simpleFullName: true},
  });
  if (!partner) {
    throw new SeedLookupError(
      `Partner with email '${email}' not found. Create an AOSPartner with that email address first.`,
    );
  }
  return partner;
}

/* Suppliers must be customers. Review authors can be any partner. */
export async function findCustomerPartnerByEmail(
  client: Client,
  email: string,
) {
  const partner = await client.aOSPartner.findOne({
    where: {emailAddress: {address: email}},
    select: {id: true, name: true, simpleFullName: true, isCustomer: true},
  });
  if (!partner) {
    throw new SeedLookupError(
      `Partner with email '${email}' not found. Create an AOSPartner with that email address first.`,
    );
  }
  if (!partner.isCustomer) {
    throw new SeedLookupError(
      `Supplier partner with email '${email}' exists but is not a customer (isCustomer=false). Suppliers must be customers. Update the partner in AOS and try again.`,
    );
  }
  return partner;
}

export async function findCategoryByCode(client: Client, code: string) {
  const category = await client.aOSProductCategory.findOne({
    where: {code, forMarketPlace: true},
    select: {id: true, code: true, name: true},
  });
  if (!category) {
    const existing = await client.aOSProductCategory.find({
      where: {forMarketPlace: true},
      select: {code: true},
    });
    throw new SeedLookupError(
      `Marketplace category '${code}' not found. Existing (forMarketPlace=true): ${existing.map(c => c.code).join(', ') || '(none)'}`,
    );
  }
  return category;
}

export async function findCompatibilityVersionByName(
  client: Client,
  name: string,
) {
  const version = await client.aOSMarketplaceAxelorVersion.findOne({
    where: {name},
    select: {id: true, name: true},
  });
  if (!version) {
    throw new SeedLookupError(
      `Axelor compatibility version '${name}' not found. Add it to compatibilityVersions[] in the seed file or create it via AOS.`,
    );
  }
  return version;
}
