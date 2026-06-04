/* Self-contained ORM fetches for the product price-parity script. Kept
 * local to the core product dir on purpose: this is a pure product test
 * with no marketplace coupling, so it reads what the core's
 * `getSaleUnitPrice` / `applyPriceList` need directly from the generated
 * client rather than borrowing any subapp's query layer. */
import type {Client} from '@/goovee/.generated/client';

const currencySelect = {
  codeISO: true,
  code: true,
  symbol: true,
  numberOfDecimals: true,
} as const;

const taxSelect = {
  id: true,
  activeTaxLine: {id: true, value: true},
  taxLineList: {
    select: {id: true, value: true, startDate: true, endDate: true},
  },
} as const;

const accountManagementSelect = {
  company: {id: true},
  saleTaxSet: {select: taxSelect},
} as const;

/** Everything the core's level-1 `getSaleUnitPrice` reads off a product:
 *  the sale price fields, per-company overrides, the tax configuration
 *  (own + family), the units, and the category (for price-list fallback). */
const productPriceSelect = {
  name: true,
  code: true,
  salePrice: true,
  inAti: true,
  sellable: true,
  saleCurrency: currencySelect,
  unit: {id: true},
  salesUnit: {id: true},
  productCategory: {id: true},
  productCompanyList: {
    select: {
      company: {id: true},
      salePrice: true,
      inAti: true,
      saleCurrency: currencySelect,
    },
  },
  accountManagementList: {select: accountManagementSelect},
  productFamily: {accountManagementList: {select: accountManagementSelect}},
} as const;

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

/** Names of the product fields an admin flagged company-specific
 *  (`AppBase.companySpecificProductFieldsSet`) — the core consults a
 *  product's per-company override row only for these. */
export async function loadCompanySpecificProductFields(client: Client) {
  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {companySpecificProductFieldsSet: {select: {name: true}}},
  });
  return (appBase?.companySpecificProductFieldsSet ?? [])
    .map(field => field.name)
    .filter((name): name is string => !!name);
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

/** Resolves `--currency` values (ISO/printing code or id) to currency
 *  rows; `'all'` returns every currency. Empty input → no override (AOS
 *  then picks the partner's or the product's currency). */
export async function loadCurrencies(
  client: Client,
  values: string[] | undefined,
) {
  if (!values || values.length === 0) return [];
  if (values.includes('all')) {
    return client.aOSCurrency.find({select: currencySelect});
  }
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
  fiscalPosition: {
    taxEquivList: {
      select: {
        fromTaxSet: {select: {id: true}},
        toTaxSet: {select: taxSelect},
      },
    },
  },
  salePartnerPriceList: {
    priceListSet: {
      select: {
        id: true,
        title: true,
        isActive: true,
        generalDiscount: true,
        applicationBeginDate: true,
        applicationEndDate: true,
      },
    },
  },
} as const;

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

/** Exchange-rate lines covering the given currency pairs, in both
 *  directions (matched on `codeISO`, as the core does). */
export async function loadConversionLines(
  client: Client,
  fromCodes: Array<string | null | undefined>,
  toCodes: Array<string | null | undefined>,
) {
  const clean = (codes: Array<string | null | undefined>) =>
    Array.from(
      new Set(codes.filter((c): c is string => typeof c === 'string' && !!c)),
    );
  const froms = clean(fromCodes);
  const tos = clean(toCodes);
  if (froms.length === 0 || tos.length === 0) return [];

  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      currencyConversionLineList: {
        where: {
          OR: [
            {
              startCurrency: {codeISO: {in: froms}},
              endCurrency: {codeISO: {in: tos}},
            },
            {
              startCurrency: {codeISO: {in: tos}},
              endCurrency: {codeISO: {in: froms}},
            },
          ],
        },
        select: {
          startCurrency: {codeISO: true},
          endCurrency: {codeISO: true},
          exchangeRate: true,
          fromDate: true,
          toDate: true,
        },
      },
    },
  });
  return appBase?.currencyConversionLineList ?? [];
}

export type PriceListLineRow = Awaited<
  ReturnType<typeof loadPriceListLines>
>[number];

/** All lines of one price list, with the product / category they target —
 *  the script partitions these per product (product lines vs its category's)
 *  the way AOS's two queries do. */
export async function loadPriceListLines(client: Client, priceListId: string) {
  return client.aOSPriceListLine.find({
    where: {priceList: {id: priceListId}},
    select: {
      typeSelect: true,
      amountTypeSelect: true,
      amount: true,
      minQty: true,
      product: {id: true},
      productCategory: {id: true},
    },
  });
}

/** Unit-conversion lines (COEFF), for the optional `--unit` dimension. */
export async function loadUnitConversions(client: Client) {
  return client.aOSUnitConversion.find({
    where: {entitySelect: 0},
    select: {
      startUnit: {id: true},
      endUnit: {id: true},
      coef: true,
      typeSelect: true,
    },
  });
}
