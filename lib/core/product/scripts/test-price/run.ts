/* Product price-parity test.
 *
 * Sweeps products × companies × buyers × currencies and scores each product
 * across THREE prices:
 *   gv — goovee: the core's invoice price (getSaleUnitPrice + roundSaleUnitPrice)
 *   so — the TRUE AOS sale-order / invoice line price, computed via the product
 *        onchange action on a transient line (no order is persisted)
 *   ep — AOS's /ws/aos/product/price endpoint (only INDICATIONAL: its
 *        applyPriceList round-trip can sit a cent off the invoiced line)
 *
 * Per product:  gv ≠ so → FAILURE;  gv == so but ep differs → PARTIAL;
 *               all three agree → SUCCESS.
 * gv-vs-so is the real correctness signal; ep is the bonus. The run exits
 * non-zero only on a failure (partials are fine). Both the unit price and the
 * billable line total (exTaxTotal/inTaxTotal) are compared against so — the
 * total is the only place a SEPARATE-mode discount surfaces.
 *
 * Unit conversion (--unit) is the exception: AOS invoice lines never
 * unit-convert price — only the quick-price endpoint does (see the pricing-core
 * doc in pricing.ts). So when a product's requested unit differs from its sale
 * unit, so is NOT a valid reference; gv's discounted line total is validated
 * against ep instead (indicational, so partial at worst). --unit is therefore
 * left out of the default sweep.
 *
 * Pure product test: no marketplace involvement, nothing persisted. Every
 * dimension (product, company, partner, currency, unit) is a CLI flag; with
 * none it sweeps sensible defaults.
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
  getDefaultPriceList,
  PriceComputationError,
  quoteProductPrice,
  round,
  todayInTimezone,
} from '../../pricing';
import type {PriceListRow} from '@/product/orm';
import {processBatch} from './batch';
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
Product price-parity test — scores each product across three prices:
  gv  goovee invoice price (getSaleUnitPrice + roundSaleUnitPrice)
  so  the TRUE AOS sale-order / invoice line price (product onchange action,
      computed on a transient line — NO order is persisted)
  ep  AOS /ws/aos/product/price endpoint (only indicational)

gv ≠ so → FAILURE; gv == so but ep differs → PARTIAL (the known endpoint↔
invoice gap); all three agree → SUCCESS. Exits non-zero only on a failure.

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
  | {
      ok: true;
      wt: number;
      ati: number;
      currencyCode: string;
      /** The billable line totals (qty 1) — unit price after the residual
       *  price-list discount, rounded to the currency. */
      exTaxTotal: number;
      inTaxTotal: number;
    }
  | {ok: false; error: string};

/* The quantity every price is computed at. A single knob so the unit-price
 * vs line-total relationship is explicit: at LINE_QTY the line total divided
 * by it is the discounted unit price (relied on by eqTotalToUnit). The sweep
 * doesn't vary quantity. */
const LINE_QTY = 1;

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
  priceList: PriceListRow | null;
  priceListLines: PriceListLineRow[];
  requestedUnit: {id: string} | null;
  unitConversions: Awaited<ReturnType<typeof loadUnitConversions>>;
  /** The order's tax-basis orientation (its `inAti`): which basis is the
   *  primary that gets rounded, the other being derived from it. */
  atiPrimary: boolean;
}): GooveePrice {
  try {
    /* The whole gv pipeline is the core's quoteProductPrice; the test only
     * reads the unit price + line totals and ignores the display fields. quote
     * partitions the price-list lines per product/category itself; no buyer →
     * no price list (gate it to null). */
    const quote = quoteProductPrice({
      product,
      company: {id: company.id, timezone: company.timezone},
      fiscalPosition: partner.partner?.fiscalPosition ?? null,
      toCurrency,
      conversionLines,
      companySpecificProductFields,
      priceList: partner.id != null ? priceList : null,
      priceListLines,
      computeMethodDiscountSelect: appConfig.computeMethodDiscountSelect,
      inAti: atiPrimary,
      qty: LINE_QTY,
      ...(requestedUnit ? {requestedUnit, unitConversions} : {}),
      nbDecimalForUnitPrice: appConfig.nbDecimalForUnitPrice,
    });

    return {
      ok: true,
      wt: quote.unitPrice.wt,
      ati: quote.unitPrice.ati,
      currencyCode: toCurrency.code ?? '',
      exTaxTotal: quote.exTaxTotal,
      inTaxTotal: quote.inTaxTotal,
    };
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

type PriceResult =
  | {
      ok: true;
      wt: number;
      ati: number;
      /** Line totals — only the sale-order (`so`) source returns these; the
       *  endpoint (`ep`) prices a unit only, so it leaves them undefined. */
      exTaxTotal?: number;
      inTaxTotal?: number;
    }
  | {ok: false; error: string};

/** Fetches the TRUE sale-order / invoice line price by running the product
 *  onchange action on a TRANSIENT line — the same computation the SO form
 *  fires, with NO order persisted. The `_parent` carries the order context
 *  (company / buyer / currency / inAti) the price resolution needs. */
async function fetchSaleOrderPrice({
  config,
  productId,
  companyId,
  partnerId,
  fiscalPositionId,
  priceListId,
  currencyId,
  unitId,
  today,
  inAti,
}: {
  config: {aos: {url: string; auth: Parameters<typeof getAOSAuthHeaders>[0]}};
  productId: string;
  companyId: string;
  partnerId: string;
  fiscalPositionId: string | null;
  priceListId: string | null;
  currencyId: string;
  unitId: string | null;
  today: string;
  inAti: boolean;
}): Promise<PriceResult> {
  /* No try/catch: any network or non-2xx HTTP error propagates and crashes
   * the run (the preflight already confirmed AOS is up, so a failure now is
   * real, not a price verdict). Mirrors fetchAosPrices. */
  const res = await axios.post(
    `${config.aos.url}/ws/action`,
    {
      model: 'com.axelor.apps.sale.db.SaleOrderLine',
      action: 'action-sale-order-line-method-get-product-information',
      data: {
        context: {
          _model: 'com.axelor.apps.sale.db.SaleOrderLine',
          product: {id: Number(productId)},
          qty: 1,
          ...(unitId ? {unit: {id: Number(unitId)}} : {}),
          _parent: {
            _model: 'com.axelor.apps.sale.db.SaleOrder',
            company: {id: Number(companyId)},
            clientPartner: {id: Number(partnerId)},
            currency: {id: Number(currencyId)},
            /* The SO-line tax reads `saleOrder.fiscalPosition` — set it so the
             * fiscal-position tax remap is applied, as a real order (which
             * copies it from the partner) would. */
            ...(fiscalPositionId
              ? {fiscalPosition: {id: Number(fiscalPositionId)}}
              : {}),
            /* The discount fill reads `saleOrder.priceList` (a real order
             * copies it from the partner). Without it the price list never
             * applies and the totals come back undiscounted. */
            ...(priceListId ? {priceList: {id: Number(priceListId)}} : {}),
            inAti,
            creationDate: today,
          },
        },
      },
    },
    {headers: getAOSAuthHeaders(config.aos.auth)},
  );
  const blocks = res.data?.data ?? [];
  for (const block of blocks) {
    const values = block?.values;
    if (values && values.price != null) {
      return {
        ok: true,
        wt: Number(values.price),
        ati: Number(values.inTaxPrice),
        exTaxTotal: Number(values.exTaxTotal),
        inTaxTotal: Number(values.inTaxTotal),
      };
    }
  }
  /* HTTP 200 but no price → a legitimate "can't price" (e.g. an unconvertible
   * currency); surface the action's note as a so-error result (not a crash). */
  const note = blocks
    .map(
      (b: {error?: string; alert?: string; flash?: string}) =>
        b?.error ?? b?.alert ?? b?.flash,
    )
    .find(Boolean);
  return {ok: false, error: String(note ?? res.data?.error ?? 'no price')};
}

/** The endpoint entry normalised to a price/error result. */
function endpointResult(entry: AosPriceEntry | undefined): PriceResult {
  if (!entry || entry.errorMessage) {
    return {ok: false, error: entry?.errorMessage ?? 'no entry'};
  }
  const wt = Number(entry.prices?.find(p => p.type === 'WT')?.price);
  const ati = Number(entry.prices?.find(p => p.type === 'ATI')?.price);
  if (!Number.isFinite(wt)) return {ok: false, error: 'no price'};
  return {ok: true, wt, ati};
}

/** Two results agree when both price to the same wt/ati (rounded), or both
 *  error — neither could price, so they agree on that. */
function eq(
  a: {ok: true; wt: number; ati: number} | {ok: false},
  b: {ok: true; wt: number; ati: number} | {ok: false},
  nb: number,
): boolean {
  if (!a.ok || !b.ok) return !a.ok && !b.ok;
  const eps = 0.5 * 10 ** -nb;
  return (
    Math.abs(round(a.wt, nb) - round(b.wt, nb)) < eps &&
    Math.abs(round(a.ati, nb) - round(b.ati, nb)) < eps
  );
}

/** The billable line totals agree (ex-tax and in-tax). Returns true when
 *  either side lacks totals — there is nothing to disprove, so it never turns
 *  a row red on its own. */
function eqTotal(
  a: GooveePrice | PriceResult,
  b: GooveePrice | PriceResult,
  nb: number,
): boolean {
  if (!a.ok || !b.ok) return true;
  /* Either side missing or non-numeric totals (e.g. AOS omitted them, or a
   * stray NaN from a missing field) → can't disprove, so don't fail the row on
   * the total alone; the unit-price check still applies. */
  if (
    a.exTaxTotal == null ||
    a.inTaxTotal == null ||
    b.exTaxTotal == null ||
    b.inTaxTotal == null
  ) {
    return true;
  }
  if (
    !Number.isFinite(a.exTaxTotal) ||
    !Number.isFinite(a.inTaxTotal) ||
    !Number.isFinite(b.exTaxTotal) ||
    !Number.isFinite(b.inTaxTotal)
  ) {
    return true;
  }
  const eps = 0.5 * 10 ** -nb;
  return (
    Math.abs(a.exTaxTotal - b.exTaxTotal) < eps &&
    Math.abs(a.inTaxTotal - b.inTaxTotal) < eps
  );
}

/** gv's discounted unit price matches ep's unit price. Used only for the
 *  unit-converted case: ep folds the discount into its unit price, and gv's
 *  line total ÷ LINE_QTY is that same discounted unit-converted price, so the
 *  two are the comparable pair (dividing by LINE_QTY keeps this correct even
 *  if the quantity ever changes). */
function eqTotalToUnit(gv: GooveePrice, ep: PriceResult, nb: number): boolean {
  if (!gv.ok || !ep.ok) return false;
  if (
    !Number.isFinite(gv.exTaxTotal) ||
    !Number.isFinite(gv.inTaxTotal) ||
    !Number.isFinite(ep.wt) ||
    !Number.isFinite(ep.ati)
  ) {
    return false;
  }
  const eps = 0.5 * 10 ** -nb;
  return (
    Math.abs(gv.exTaxTotal / LINE_QTY - ep.wt) < eps &&
    Math.abs(gv.inTaxTotal / LINE_QTY - ep.ati) < eps
  );
}

type RowStatus = 'success' | 'partial' | 'failure';

type Row = {
  status: RowStatus;
  productId: string;
  name: string;
  gv: string;
  so: string;
  ep: string;
  gvTot: string;
  soTot: string;
};

/** Scores one product across the three prices: gv (goovee), so (the true
 *  sale-order / invoice line) and ep (the indicational endpoint).
 *
 *  Stage 1 — errors, on gv vs ep: both error → they agree it can't be priced
 *  (success); exactly one errors → failure.
 *  Stage 2 — both gv and ep produced a value:
 *    - no buyer (no sale order to reference) → gv vs ep: match → success, else
 *      → partial;
 *    - buyer → gv vs so: a unit-price OR a line-total mismatch → failure;
 *      both match → then vs ep (unit price): all three match → success, else
 *      → partial. The line total is the billable amount and the only place a
 *      SEPARATE-mode discount shows up.
 *
 *  `unitConverted` — gv priced in a unit other than the sale unit. AOS invoice
 *  lines never unit-convert price (only the endpoint does, see the pricing-core
 *  doc), so `so` is not a valid reference: instead compare gv's discounted line
 *  total (qty 1) against `ep`'s unit price — the one path that unit-converts.
 *  `ep` is indicational, so a mismatch is partial, never a failure. */
function compare3(
  product: PriceProduct,
  gv: GooveePrice,
  so: PriceResult | null,
  ep: PriceResult,
  nb: number,
  unitConverted: boolean,
): Row {
  let status: RowStatus;
  if (!gv.ok || !ep.ok) {
    status = !gv.ok && !ep.ok ? 'success' : 'failure';
  } else if (unitConverted) {
    status = eqTotalToUnit(gv, ep, nb) ? 'success' : 'partial';
  } else if (so === null) {
    status = eq(gv, ep, nb) ? 'success' : 'partial';
  } else {
    status =
      !eq(gv, so, nb) || !eqTotal(gv, so, nb)
        ? 'failure'
        : eq(gv, ep, nb)
          ? 'success'
          : 'partial';
  }
  const fmt = (r: GooveePrice | PriceResult) =>
    r.ok
      ? `${round(r.wt, nb)}/${round(r.ati, nb)}`
      : `err:${r.error.slice(0, 22)}`;
  const fmtTot = (r: GooveePrice | PriceResult) =>
    r.ok && r.exTaxTotal != null && r.inTaxTotal != null
      ? `${round(r.exTaxTotal, nb)}/${round(r.inTaxTotal, nb)}`
      : '-';
  return {
    status,
    productId: product.id,
    name: (product.name ?? product.code ?? product.id).slice(0, 28),
    gv: fmt(gv),
    so: so === null || unitConverted ? 'n/a' : fmt(so),
    ep: fmt(ep),
    gvTot: fmtTot(gv),
    soTot: so === null || unitConverted ? 'n/a' : fmtTot(so),
  };
}

const YELLOW = '\x1b[33m';
const STATUS_ICON: Record<RowStatus, string> = {
  success: `${GREEN}✔`,
  partial: `${YELLOW}◐`,
  failure: `${RED}✖`,
};

function renderRows(rows: Row[]): void {
  const w = {
    id: Math.max(2, ...rows.map(r => r.productId.length)),
    name: Math.min(28, Math.max(4, ...rows.map(r => r.name.length))),
    gv: Math.max(12, ...rows.map(r => r.gv.length)),
    so: Math.max(12, ...rows.map(r => r.so.length)),
    ep: Math.max(12, ...rows.map(r => r.ep.length)),
    gvTot: Math.max(10, ...rows.map(r => r.gvTot.length)),
    soTot: Math.max(10, ...rows.map(r => r.soTot.length)),
  };
  const pad = (s: string, n: number) => s.padEnd(n);
  for (const r of rows) {
    console.log(
      `  ${STATUS_ICON[r.status]}${RESET}  ${pad(r.productId, w.id)}  ${pad(r.name, w.name)}  ` +
        `${DIM}gv${RESET} ${pad(r.gv, w.gv)}  ${DIM}so${RESET} ${pad(r.so, w.so)}  ${DIM}ep${RESET} ${pad(r.ep, w.ep)}  ` +
        `${DIM}Σgv${RESET} ${pad(r.gvTot, w.gvTot)}  ${DIM}Σso${RESET} ${pad(r.soTot, w.soTot)}`,
    );
  }
}

/** Up-front reachability check: the public app-info endpoint answers 200
 *  without auth when the back end is up. If it doesn't, tell the invoker
 *  plainly and stop — rather than failing deep in the sweep. After this passes
 *  the run assumes AOS is reachable and lets any later network error crash. */
async function assertAosReachable(config: {aos: {url: string}}): Promise<void> {
  const url = `${config.aos.url}/ws/public/app/info`;
  try {
    await axios.get(url, {timeout: 10_000});
  } catch (err) {
    const why = axios.isAxiosError(err)
      ? err.response
        ? `HTTP ${err.response.status}`
        : (err.code ?? 'no response')
      : String(err);
    console.error(
      `${RED}AOS back end is not accessible at ${url} (${why}). Is it running?${RESET}`,
    );
    process.exit(1);
  }
}

async function main() {
  const tenantId = values.tenant ?? DEFAULT_TENANT;
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);
  const {client, config} = tenant;
  const verbose = Boolean(values.verbose);

  await assertAosReachable(config);

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

  let totSuccess = 0;
  let totPartial = 0;
  let totFailure = 0;

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
        /* Conversion lines for this combo: from each product currency to the
         * target (override) currency. */
        const conversionLines = await loadConversionLines(
          client,
          products.map(p => p.saleCurrency?.codeISO),
          [currencyOverride.codeISO],
        );

        /* The two AOS sources for this combo — ep (batched endpoint) and so
         * (per-product onchange) — are fetched in parallel; gv is then computed
         * locally from the already-loaded data. No buyer → no sale order to
         * price against, so skip `so` (compared gv-vs-ep). Otherwise carry the
         * buyer's fiscal position so the onchange applies the same tax remap a
         * real order would. */
        const partnerId = partnerSample.id;
        const fiscalPositionId =
          partnerSample.partner?.fiscalPosition?.id ?? null;
        const [aosById, sos] = await Promise.all([
          fetchAosPrices({
            config,
            productIds: products.map(p => p.id),
            partnerId: partnerSample.id,
            companyId,
            currencyId: currencyOverride.id,
            unitId: values.unit ?? null,
          }),
          processBatch(products, product =>
            partnerId == null
              ? Promise.resolve(null)
              : fetchSaleOrderPrice({
                  config,
                  productId: product.id,
                  companyId,
                  partnerId,
                  fiscalPositionId,
                  priceListId: priceList?.id ?? null,
                  currencyId: currencyOverride.id,
                  unitId: values.unit ?? null,
                  today,
                  inAti: atiPrimary,
                }),
          ),
        ]);

        const rows = products.map((product, i) =>
          compare3(
            product,
            computeGooveePrice({
              product,
              company: {...company, id: companyId},
              partner: partnerSample,
              toCurrency: currencyOverride,
              conversionLines,
              companySpecificProductFields,
              appConfig,
              priceList,
              priceListLines,
              requestedUnit,
              unitConversions,
              atiPrimary,
            }),
            sos[i],
            endpointResult(aosById.get(product.id)),
            nb,
            /* Did gv unit-convert this product? AOS invoice lines never
             * unit-convert price (only the quick-price endpoint does), so when
             * the requested unit differs from the sale unit `so` can't be the
             * reference — validate gv against `ep` instead. */
            requestedUnit != null &&
              requestedUnit.id !==
                (product.salesUnit?.id ?? product.unit?.id ?? null),
          ),
        );

        const fail = rows.filter(r => r.status === 'failure').length;
        const part = rows.filter(r => r.status === 'partial').length;
        const succ = rows.length - fail - part;
        totSuccess += succ;
        totPartial += part;
        totFailure += fail;

        const label =
          `company=${company.name ?? companyId} buyer=${partnerSample.label} ` +
          `cur=${currencyOverride.code}` +
          (priceList ? ` [priceList ${priceList.id}]` : '');
        const icon = fail ? `${RED}✖` : part ? `${YELLOW}◐` : `${GREEN}✔`;
        console.log(
          `\n${icon}${RESET} ${BOLD}${label}${RESET}  ` +
            `${succ} ok / ${part} partial / ${fail} fail (of ${rows.length})`,
        );
        const visible = verbose
          ? rows
          : rows.filter(r => r.status !== 'success');
        if (visible.length) renderRows(visible);
      }
    }
  }

  console.log(
    `\n${totFailure === 0 ? GREEN : RED}${totSuccess} success / ${totPartial} partial / ` +
      `${totFailure} failure across all combinations.${RESET}\n`,
  );
  process.exit(totFailure === 0 ? 0 : 1);
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
