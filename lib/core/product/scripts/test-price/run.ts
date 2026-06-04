/* Product price-parity test.
 *
 * Sweeps products × companies × buyers × currencies, prices each one with the
 * core's INVOICE path (`getSaleUnitPrice` + `roundSaleUnitPrice`, the
 * sale-order/invoice-line pairing), and compares it against AOS's
 * `/ws/aos/product/price` endpoint. That endpoint is only INDICATIONAL — its
 * `applyPriceList` round-trip can sit a cent off the invoiced line — so some
 * cross-currency ATI mismatches are expected (see price-list.ts), while
 * same-currency rows and the new target-currency-decimal rounding should match.
 *
 * Pure product test: no marketplace involvement. Every dimension the endpoint
 * accepts (product, company, partner, currency, unit) is a CLI flag; with none,
 * it sweeps sensible defaults.
 *
 * Run:  pnpm test-price -- --help
 */
import '@/load-swc-env';

import axios from 'axios';
import {parseArgs} from 'node:util';

import {DEFAULT_TENANT} from '@/constants';
import {manager} from '@/tenant';
import {getAOSAuthHeaders} from '@/tenant/auth';

import {
  convertUnitPrice,
  getSaleUnitPrice,
  PriceComputationError,
  round,
  roundSaleUnitPrice,
  todayInTimezone,
} from '../../pricing';
import {
  getDefaultPriceList,
  getDiscountedPrice,
  type PricingPriceList,
} from '../../price-list';
import {
  loadAppConfig,
  loadCompanies,
  loadCompanySpecificProductFields,
  loadConversionLines,
  loadCurrencies,
  loadPartnerSamples,
  loadPriceListLines,
  loadProducts,
  loadUnitConversions,
  type CompanyRow,
  type CurrencyRow,
  type PartnerSample,
  type PriceListLineRow,
  type PriceProduct,
} from './orm';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[90m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/* The default target currencies (ISO codes) the sweep prices into. A spread
 * that exercises conversion and the error path: EUR (base, rate 1), GBP/CHF
 * (European), USD/CNY (distinct, 2-decimal), JPY (distinct, 0-decimal — guards
 * the target-currency-decimal rounding), and INR (no exchange rate from EUR,
 * so both sides error identically — shows the CURRENCY_1 path). */
const DEFAULT_CURRENCIES = ['EUR', 'GBP', 'CHF', 'USD', 'CNY', 'JPY', 'INR'];

type AosPriceEntry = {
  productId: number;
  prices?: Array<{type: 'WT' | 'ATI'; price: string}>;
  currency?: {currencyId: number; code: string; symbol: string};
  errorMessage?: string;
};

const {values} = parseArgs({
  args: process.argv.slice(2).filter(a => a !== '--'),
  options: {
    tenant: {type: 'string'},
    product: {type: 'string', multiple: true},
    partner: {type: 'string', multiple: true},
    company: {type: 'string', multiple: true},
    currency: {type: 'string', multiple: true},
    unit: {type: 'string'},
    limit: {type: 'string'},
    'all-products': {type: 'boolean'},
    'all-partners': {type: 'boolean'},
    'ati-primary': {type: 'boolean'},
    verbose: {type: 'boolean'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Product price-parity test — our INVOICE price (getSaleUnitPrice +
roundSaleUnitPrice, the sale-order/invoice-line pairing) vs AOS.

The AOS reference is the /ws/aos/product/price endpoint, which is only
INDICATIONAL: its applyPriceList round-trip can sit a cent off the invoiced
line (see price-list.ts). So a few mismatches here are expected and are the
known endpoint↔invoice gap, not a bug in our price. (TODO: repoint the
reference to actual order-line creation.)

Defaults sweep every sellable product, every company, one buyer per distinct
(fiscal position, currency, sale price list) + a no-buyer row, and a curated
set of target currencies — a few European, a few distinct, and one with no
exchange rate (to show the error path): ${DEFAULT_CURRENCIES.join(', ')}.

Usage:
  pnpm test-price [-- <options>]

Options:
  --product <id>     Product id (repeatable). Default: all sellable products.
  --company <id>     Selling company id (repeatable). Default: all companies.
  --partner <id>     Buyer partner id (repeatable). Default: one per
                     (fiscalPosition, currency, priceList) + none.
  --currency <c>     Target currency code or id (repeatable). Override the
                     default curated set above.
  --unit <id>        Quote every product in this unit id (needs conversions).
  --limit <n>        Cap the number of products (quick runs).
  --all-products     Include non-sellable / all products, not just sellable.
  --all-partners     Use every partner instead of the sampled set.
  --ati-primary      Price as an ATI-oriented order (round ATI, derive WT).
                     Default: WT-primary (match the company's sale-order config).
  --tenant <id>      Tenant id (default: ${DEFAULT_TENANT}).
  --verbose          Print every row, not only mismatches.
`);
  process.exit(0);
}

type GooveePrice =
  | {ok: true; wt: number; ati: number; currencyCode: string}
  | {ok: false; error: string};

function computeGooveePrice({
  product,
  company,
  partner,
  toCurrency,
  conversionLines,
  companySpecificProductFields,
  appConfig,
  priceList,
  priceListLines,
  requestedUnit,
  unitConversions,
  atiPrimary,
}: {
  product: PriceProduct;
  company: CompanyRow & {id: string};
  partner: PartnerSample;
  toCurrency: CurrencyRow;
  conversionLines: Awaited<ReturnType<typeof loadConversionLines>>;
  companySpecificProductFields: string[];
  appConfig: {
    nbDecimalForUnitPrice: number;
    computeMethodDiscountSelect: number;
  };
  priceList: (PricingPriceList & {id: string}) | null;
  priceListLines: PriceListLineRow[];
  requestedUnit: {id: string} | null;
  unitConversions: Awaited<ReturnType<typeof loadUnitConversions>>;
  /** The order's tax-basis orientation (its `inAti`): which basis is the
   *  primary that gets rounded, the other being derived from it. */
  atiPrimary: boolean;
}): GooveePrice {
  try {
    const result = getSaleUnitPrice({
      product,
      company: {id: company.id, timezone: company.timezone},
      fiscalPosition: partner.partner?.fiscalPosition ?? null,
      toCurrency,
      conversionLines,
      companySpecificProductFields,
      qty: 1,
      ...(requestedUnit ? {requestedUnit, unitConversions} : {}),
    });

    const nb = appConfig.nbDecimalForUnitPrice;
    /* Invoice pairing: round the primary basis, derive the other from it —
     * the way a sale-order / invoice line stores price + inTaxPrice. (This
     * is NOT the endpoint's applyPriceList round-trip.) */
    let {wt, ati} = roundSaleUnitPrice(result, atiPrimary, nb);

    /* Price-list discount, invoice-style: applied on the primary basis via
     * SaleOrderLineDiscountServiceImpl's composition (getDiscountedPrice,
     * which honours the folded price), then the other basis re-derived. */
    if (partner.id != null && priceList) {
      const productLines = priceListLines.filter(
        line => line.product?.id === product.id,
      );
      const categoryLines = product.productCategory?.id
        ? priceListLines.filter(
            line => line.productCategory?.id === product.productCategory?.id,
          )
        : [];
      const primary = atiPrimary ? ati : wt;
      const discounted = round(
        getDiscountedPrice({
          priceList,
          productLines,
          categoryLines,
          qty: 1,
          price: primary,
          computeMethodDiscountSelect: appConfig.computeMethodDiscountSelect,
          nbDecimalForUnitPrice: nb,
        }),
        nb,
      );
      if (atiPrimary) {
        ati = discounted;
        wt = convertUnitPrice(true, result.taxRate, discounted, nb);
      } else {
        wt = discounted;
        ati = convertUnitPrice(false, result.taxRate, discounted, nb);
      }
    }

    return {ok: true, wt, ati, currencyCode: toCurrency.code ?? ''};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof PriceComputationError ? err.code : String(err),
    };
  }
}

async function fetchAosPrices({
  config,
  productIds,
  partnerId,
  companyId,
  currencyId,
  unitId,
}: {
  config: {aos: {url: string; auth: Parameters<typeof getAOSAuthHeaders>[0]}};
  productIds: string[];
  partnerId: string | null;
  companyId: string;
  currencyId: string | null;
  unitId: string | null;
}): Promise<Map<string, AosPriceEntry>> {
  const res = await axios.post(
    `${config.aos.url}/ws/aos/product/price`,
    {
      apiVersion: 1,
      productList: productIds.map(id => ({
        productId: Number(id),
        ...(unitId ? {unitId: Number(unitId)} : {}),
      })),
      ...(partnerId ? {partnerId: Number(partnerId)} : {}),
      companyId: Number(companyId),
      ...(currencyId ? {currencyId: Number(currencyId)} : {}),
    },
    {headers: getAOSAuthHeaders(config.aos.auth)},
  );
  const entries: AosPriceEntry[] = res.data?.object ?? [];
  return new Map(entries.map(entry => [String(entry.productId), entry]));
}

type Row = {
  ok: boolean;
  productId: string;
  name: string;
  goovee: string;
  aos: string;
};

function compareRow(
  product: PriceProduct,
  goovee: GooveePrice,
  aos: AosPriceEntry | undefined,
  nb: number,
): Row {
  const name = (product.name ?? product.code ?? product.id).slice(0, 30);
  const aosErr = aos?.errorMessage;
  if (!goovee.ok || aosErr) {
    /* Both sides failing is a match — the core throws exactly where AOS does. */
    const ok = !goovee.ok && !!aosErr;
    return {
      ok,
      productId: product.id,
      name,
      goovee: goovee.ok ? `${goovee.wt}/${goovee.ati}` : `err:${goovee.error}`,
      aos: aosErr ? `err:${aosErr}` : '(priced)',
    };
  }
  const aosWt = Number(aos?.prices?.find(p => p.type === 'WT')?.price);
  const aosAti = Number(aos?.prices?.find(p => p.type === 'ATI')?.price);
  const aosCode = aos?.currency?.code;
  const eps = 0.5 * 10 ** -nb;
  const ok =
    Math.abs(round(goovee.wt, nb) - round(aosWt, nb)) < eps &&
    Math.abs(round(goovee.ati, nb) - round(aosAti, nb)) < eps &&
    goovee.currencyCode === aosCode;
  return {
    ok,
    productId: product.id,
    name,
    goovee: `${goovee.wt}/${goovee.ati} ${goovee.currencyCode}`,
    aos: `${aosWt}/${aosAti} ${aosCode ?? '-'}`,
  };
}

function renderRows(rows: Row[]): void {
  const w = {
    id: Math.max(2, ...rows.map(r => r.productId.length)),
    name: Math.min(30, Math.max(4, ...rows.map(r => r.name.length))),
    gv: Math.max(20, ...rows.map(r => r.goovee.length)),
    aos: Math.max(20, ...rows.map(r => r.aos.length)),
  };
  const pad = (s: string, n: number) => s.padEnd(n);
  for (const r of rows) {
    console.log(
      `  ${r.ok ? GREEN + '✔' : RED + '✖'}${RESET}  ` +
        `${pad(r.productId, w.id)}  ${pad(r.name, w.name)}  ` +
        `${DIM}gv${RESET} ${pad(r.goovee, w.gv)}  ${DIM}aos${RESET} ${pad(r.aos, w.aos)}`,
    );
  }
}

async function main() {
  const tenantId = values.tenant ?? DEFAULT_TENANT;
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);
  const {client, config} = tenant;
  const verbose = Boolean(values.verbose);

  const [appConfig, companySpecificProductFields, unitConversions] =
    await Promise.all([
      loadAppConfig(client),
      loadCompanySpecificProductFields(client),
      values.unit ? loadUnitConversions(client) : Promise.resolve([]),
    ]);

  const [products, companies, currencies, partners] = await Promise.all([
    loadProducts(client, {
      ids: values.product,
      allProducts: values['all-products'],
      limit: values.limit ? Number(values.limit) : undefined,
    }),
    loadCompanies(client, values.company),
    loadCurrencies(
      client,
      values.currency && values.currency.length > 0
        ? values.currency
        : DEFAULT_CURRENCIES,
    ),
    loadPartnerSamples(client, {
      ids: values.partner,
      allPartners: values['all-partners'],
    }),
  ]);

  if (products.length === 0) throw new Error('No products to test.');
  if (companies.length === 0) throw new Error('No companies found.');

  const nb = appConfig.nbDecimalForUnitPrice;
  const requestedUnit = values.unit ? {id: values.unit} : null;
  const atiPrimary = Boolean(values['ati-primary']);
  if (currencies.length === 0)
    throw new Error('No target currencies resolved.');
  const currencyOptions: CurrencyRow[] = currencies;
  const priceListLinesCache = new Map<string, PriceListLineRow[]>();

  console.log(
    `\n${CYAN}→ tenant=${tenantId} products=${products.length} companies=${companies.length} ` +
      `partners=${partners.length} currencies=${currencies.map(c => c.code).join('/')} ` +
      `nbDecimal=${nb} computeMethod=${appConfig.computeMethodDiscountSelect}${RESET}`,
  );

  let totalChecks = 0;
  let totalMismatches = 0;

  for (const company of companies) {
    const companyId = company.id;
    const today = todayInTimezone(company.timezone);

    for (const partnerSample of partners) {
      /* The buyer's applicable sale price list (today, this company). */
      const candidateLists =
        partnerSample.partner?.salePartnerPriceList?.priceListSet ?? [];
      const priceList = getDefaultPriceList(candidateLists, today);
      if (priceList && !priceListLinesCache.has(priceList.id)) {
        priceListLinesCache.set(
          priceList.id,
          await loadPriceListLines(client, priceList.id),
        );
      }
      const priceListLines = priceList
        ? (priceListLinesCache.get(priceList.id) ?? [])
        : [];

      for (const currencyOverride of currencyOptions) {
        const partnerCurrency = partnerSample.partner?.currency ?? null;

        /* Conversion lines for this combo: from each product currency to
         * the override and/or the buyer's currency. */
        const conversionLines = await loadConversionLines(
          client,
          products.map(p => p.saleCurrency?.codeISO),
          [currencyOverride?.codeISO, partnerCurrency?.codeISO],
        );

        const aosById = await fetchAosPrices({
          config,
          productIds: products.map(p => p.id),
          partnerId: partnerSample.id,
          companyId,
          currencyId: currencyOverride?.id ?? null,
          unitId: values.unit ?? null,
        });

        const rows: Row[] = [];
        for (const product of products) {
          const toCurrency =
            currencyOverride ?? partnerCurrency ?? product.saleCurrency;
          if (!toCurrency) continue; // product with no currency at all
          const goovee = computeGooveePrice({
            product,
            company: {...company, id: companyId},
            partner: partnerSample,
            toCurrency,
            conversionLines,
            companySpecificProductFields,
            appConfig,
            priceList,
            priceListLines,
            requestedUnit,
            unitConversions,
            atiPrimary,
          });
          rows.push(compareRow(product, goovee, aosById.get(product.id), nb));
        }

        const mismatches = rows.filter(r => !r.ok).length;
        totalChecks += rows.length;
        totalMismatches += mismatches;

        const label =
          `company=${company.name ?? companyId} buyer=${partnerSample.label}` +
          (currencyOverride ? ` cur=${currencyOverride.code}` : '') +
          (priceList ? ` [priceList ${priceList.id}]` : '');
        console.log(
          `\n${mismatches === 0 ? GREEN + '✔' : RED + '✖'}${RESET} ${BOLD}${label}${RESET}  ` +
            `${rows.length - mismatches}/${rows.length} match` +
            (mismatches ? `  ${RED}(${mismatches} mismatched)${RESET}` : ''),
        );
        const visible = verbose ? rows : rows.filter(r => !r.ok);
        if (visible.length) renderRows(visible);
      }
    }
  }

  console.log(
    `\n${totalMismatches === 0 ? GREEN : RED}${totalChecks - totalMismatches}/${totalChecks} ` +
      `matches across all combinations.${RESET}\n`,
  );
  process.exit(totalMismatches === 0 ? 0 : 1);
}

main().catch(err => {
  /* Keep AOS connection failures readable instead of dumping the whole
   * axios request object — the usual cause is the back end not running. */
  if (axios.isAxiosError(err) && !err.response) {
    console.error(
      `${RED}Could not reach AOS at ${err.config?.baseURL ?? ''}${err.config?.url ?? ''}` +
        ` (${err.code ?? 'request failed'}). Is the back end running?${RESET}`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
