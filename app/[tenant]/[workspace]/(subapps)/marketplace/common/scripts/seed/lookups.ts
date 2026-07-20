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

/* Resolves the workspace AND its marketplace defaults by walking
 * AOSPortalWorkspace → defaultPartnerWorkspace → portalAppConfig. The
 * workspace default product is read once here and used as the `product`
 * m2o on every seeded MarketplaceProduct, mirroring `saveProductWithVersions` in
 * the app. Tax/currency/unit live on that workspace default Product. */
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
          defaultProductForMarketplace: {
            id: true,
            code: true,
            inAti: true,
            productTypeSelect: true,
            saleCurrency: {id: true, code: true},
          },
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
  const rawConfig = workspace.defaultPartnerWorkspace?.portalAppConfig;
  const workspaceDefaultProduct = rawConfig?.defaultProductForMarketplace;
  if (!rawConfig || !workspaceDefaultProduct?.id) {
    throw new SeedLookupError(
      `Workspace '${url}' is missing the workspace default product. Set defaultProductForMarketplace on its PortalAppConfig.`,
    );
  }
  /* The form's picker is constrained to services, but a direct DB edit
   * could leave a storable product here — which would generate spurious
   * stock moves at checkout. Fail fast at seed time. */
  if (workspaceDefaultProduct.productTypeSelect !== 'service') {
    throw new SeedLookupError(
      `Workspace '${url}' default product '${workspaceDefaultProduct.code}' has productTypeSelect='${workspaceDefaultProduct.productTypeSelect}', expected 'service'.`,
    );
  }
  const config = {
    ...rawConfig,
    defaultProductForMarketplace: workspaceDefaultProduct,
  };
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
  const category = await client.aOSMarketplaceCategory.findOne({
    where: {code},
    select: {id: true, code: true, name: true},
  });
  if (!category) {
    const existing = await client.aOSMarketplaceCategory.find({
      select: {code: true},
    });
    throw new SeedLookupError(
      `Marketplace category '${code}' not found. Existing: ${existing.map(c => c.code).join(', ') || '(none)'}`,
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
