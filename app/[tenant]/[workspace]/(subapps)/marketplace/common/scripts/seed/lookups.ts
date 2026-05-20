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
 * defaults are read once here and then stamped onto every seeded product,
 * mirroring `saveProduct` in the app. */
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
          marketplaceDefaultSaleCurrency: {
            id: true,
            code: true,
            numberOfDecimals: true,
            symbol: true,
          },
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
    !config?.marketplaceDefaultSaleCurrency?.id ||
    !config?.marketplaceDefaultUnit?.id ||
    !config?.marketplaceDefaultProductFamily?.id
  ) {
    throw new SeedLookupError(
      `Workspace '${url}' is missing marketplace pricing defaults. Set marketplaceDefaultSaleCurrency, marketplaceDefaultUnit and marketplaceDefaultProductFamily on its PortalAppConfig.`,
    );
  }
  return {...workspace, config};
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
