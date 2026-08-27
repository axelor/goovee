/* ORM fetches for the product price-parity script. The generic select
 * fragments and side-data fetches come from the core data layer
 * (`@/product/orm`); this file adds only the test-specific queries (product
 * filters, partner sampling, price-list lines) and the extra product columns
 * the test needs on top of the core fragment. */
import type {Client} from '@/goovee/.generated/client';
import type {AOSPartner, AOSProduct} from '@/goovee/.generated/models';
import type {SelectOptions} from '@goovee/orm';
import {
  currencySelect,
  fetchConversionLines,
  fiscalPositionSelectFields,
  priceListSelectFields,
  productPriceSelectFields,
} from '@/product/orm';

/** Side data the test gets straight from the core data layer, under the
 *  script's names — no inline selects. */
export {
  fetchPriceListLines as loadPriceListLines,
  fetchUnitConversions as loadUnitConversions,
  findCompanySpecificProductFields as loadCompanySpecificProductFields,
} from '@/product/orm';
export type {PriceListLineRow} from '@/product/orm';

/** The core's priceable-product fragment (which already carries the price,
 *  tax, unit and category fields pricing reads) plus the few columns this test
 *  needs only for display/filtering. The app owns the product query; core owns
 *  the pricing fragment. */
const productPriceSelect = {
  ...productPriceSelectFields,
  name: true,
  code: true,
  sellable: true,
} as const satisfies SelectOptions<AOSProduct>;

export type PriceProduct = Awaited<ReturnType<typeof loadProducts>>[number];
export type CurrencyRow = Awaited<ReturnType<typeof loadCurrencies>>[number];
export type PartnerSample = Awaited<
  ReturnType<typeof loadPartnerSamples>
>[number];
export type CompanyRow = Awaited<ReturnType<typeof loadCompanies>>[number];

/** App-wide pricing knobs AOS reads from `AppBase`: the unit-price scale
 *  and the discount compute method. */
export async function loadAppConfig(client: Client) {
  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      nbDecimalDigitForUnitPrice: true,
      computeMethodDiscountSelect: true,
    },
  });
  return {
    nbDecimalForUnitPrice: Number(appBase?.nbDecimalDigitForUnitPrice ?? 2),
    computeMethodDiscountSelect: Number(
      appBase?.computeMethodDiscountSelect ?? 0,
    ),
  };
}

export async function loadProducts(
  client: Client,
  opts: {ids?: string[]; allProducts?: boolean; limit?: number},
) {
  const where =
    opts.ids && opts.ids.length > 0
      ? {id: {in: opts.ids}}
      : opts.allProducts
        ? {OR: [{archived: false}, {archived: null}]}
        : {
            AND: [
              {OR: [{archived: false}, {archived: null}]},
              {sellable: true},
            ],
          };
  return client.aOSProduct.find({
    where,
    select: productPriceSelect,
    ...(opts.limit ? {take: opts.limit} : {}),
  });
}

export async function loadCompanies(client: Client, ids?: string[]) {
  const where =
    ids && ids.length > 0
      ? {id: {in: ids}}
      : {OR: [{archived: false}, {archived: null}]};
  return client.aOSCompany.find({
    where,
    select: {name: true, timezone: true},
  });
}

/** Resolves currency identifiers (ISO/printing code or numeric id) to
 *  currency rows. Empty input → empty. */
export async function loadCurrencies(
  client: Client,
  values: string[] | undefined,
) {
  if (!values || values.length === 0) return [];
  /* Route numeric values to the bigint `id`, everything else to the code
   * columns — mixing a non-numeric into an `id IN (…)` clause makes
   * Postgres fail to cast it to bigint. */
  const numericIds = values.filter(value => /^\d+$/.test(value));
  const codes = values.filter(value => !/^\d+$/.test(value));
  const or: Array<
    {id: {in: string[]}} | {code: {in: string[]}} | {codeISO: {in: string[]}}
  > = [];
  if (numericIds.length) or.push({id: {in: numericIds}});
  if (codes.length) or.push({code: {in: codes}}, {codeISO: {in: codes}});
  return client.aOSCurrency.find({where: {OR: or}, select: currencySelect});
}

const partnerSelect = {
  fullName: true,
  simpleFullName: true,
  name: true,
  currency: currencySelect,
  fiscalPosition: fiscalPositionSelectFields,
  salePartnerPriceList: {
    priceListSet: {select: priceListSelectFields},
  },
} as const satisfies SelectOptions<AOSPartner>;

function partnerLabel(partner: {
  fullName?: string | null;
  simpleFullName?: string | null;
  name?: string | null;
  id: string;
}) {
  return (
    partner.fullName ?? partner.simpleFullName ?? partner.name ?? partner.id
  );
}

/** The buyer partners to sweep.
 *  - explicit ids → exactly those;
 *  - `allPartners` → every (non-contact, non-archived) partner;
 *  - default → one partner per distinct (fiscalPosition, currency,
 *    salePriceList) combination, since the price only depends on the buyer
 *    through those three — plus a `null` "no buyer" row. */
export async function loadPartnerSamples(
  client: Client,
  opts: {ids?: string[]; allPartners?: boolean},
) {
  if (opts.ids && opts.ids.length > 0) {
    const partners = await client.aOSPartner.find({
      where: {id: {in: opts.ids}},
      select: partnerSelect,
    });
    return partners.map(partner => ({
      id: partner.id as string | null,
      label: partnerLabel(partner),
      partner,
    }));
  }

  const partners = await client.aOSPartner.find({
    where: {
      AND: [
        {OR: [{archived: false}, {archived: null}]},
        {OR: [{isContact: false}, {isContact: null}]},
      ],
    },
    select: partnerSelect,
    take: 5000,
  });

  const none = {id: null as string | null, label: 'none', partner: null};
  if (opts.allPartners) {
    return [
      none,
      ...partners.map(partner => ({
        id: partner.id as string | null,
        label: partnerLabel(partner),
        partner,
      })),
    ];
  }

  const samples = new Map<string, (typeof partners)[number]>();
  for (const partner of partners) {
    const key = [
      partner.fiscalPosition?.id ?? 'noFp',
      partner.currency?.code ?? 'noCur',
      partner.salePartnerPriceList?.id ?? 'noPl',
    ].join('|');
    if (!samples.has(key)) samples.set(key, partner);
  }
  return [
    none,
    ...Array.from(samples.values()).map(partner => ({
      id: partner.id as string | null,
      label: `${partnerLabel(partner)} (fp=${partner.fiscalPosition?.id ?? '-'}, cur=${partner.currency?.code ?? '-'}, pl=${partner.salePartnerPriceList?.id ?? '-'})`,
      partner,
    })),
  ];
}

/** Exchange-rate lines for the given currency pairs — the core fetch, with
 *  the script's positional signature. */
export async function loadConversionLines(
  client: Client,
  fromCodes: Array<string | null | undefined>,
  toCodes: Array<string | null | undefined>,
) {
  return fetchConversionLines({client, fromCodes, toCodes});
}
