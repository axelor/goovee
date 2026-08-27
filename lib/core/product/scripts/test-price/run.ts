/* Product price-parity test.
 *
 * Sweeps products × companies × buyers × currencies × tax-basis orientation ×
 * unit × quantity (× pricing config, on request) and scores each product across
 * THREE prices:
 *   gv — goovee: the core's invoice price (quoteProductPrice)
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
 * doc in PRICING.md). So when a product's requested unit differs from its sale
 * unit, so is NOT a valid reference; gv's discounted line total is validated
 * against ep instead (indicational, so partial at worst). No unit is requested
 * unless --unit asks for one, and the product's own unit is swept alongside it.
 *
 * The basis dimension is the ORDER's orientation. It selects which stored side
 * drives the billable totals, and whether a fixed price-list discount has to be
 * re-expressed — so the two orientations are separate paths that can disagree with
 * AOS independently. Both are swept by default and tallied separately; either can
 * be isolated with --wt-primary / --ati-primary.
 *
 * Quantity is a dimension too, not a scale factor: a price list's minQty
 * thresholds can select a different discount line at a higher quantity. ep takes
 * no quantity — it always quotes as if for one — so at any other quantity a tiered
 * price list makes ep answer a different question, and it is dropped from the
 * verdict; gv-vs-so is unaffected, both sides get the quantity.
 *
 * The pricing config itself (discount compute method, unit-price scale) changes
 * the answer on both sides, so --sweep-config walks those combinations, writing
 * each to AppBase over REST and restoring the original values at the end. It is
 * the one part of this script that mutates the instance.
 *
 * Pure product test: no marketplace involvement, no order persisted. Every
 * dimension (product, company, partner, currency, unit, quantity, basis, config)
 * is a CLI flag; with none it sweeps sensible defaults.
 *
 * Run:  pnpm pricing:compare --help
 */
import '@/load-swc-env';

import axios from 'axios';
import {explainHttpFailure} from '@/scripts/lib/http';
import * as out from '@/scripts/lib/output';
import {runTenantScript, type TenantHandle} from '@/scripts/lib/tenant-script';
import {BigDecimal} from '@goovee/orm';
import {InvalidArgumentError} from 'commander';

import type {TenantConfig} from '@/tenant';
import {getAOSHeaders} from '@/tenant/auth';

import {
  getDefaultPriceList,
  ONE,
  PriceComputationError,
  quoteProductPrice,
  toDecimalOrNull,
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

/* Named locally because the tables below interpolate them a line at a time;
 * everything else in this script goes through `out`. */
const {BOLD, CYAN, DIM, GREEN, RED, RESET, YELLOW} = out;

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

type Values = {
  product?: string[];
  partner?: string[];
  company?: string[];
  currency?: string[];
  unit?: string[];
  qty?: BigDecimal[];
  limit?: number;
  allProducts?: boolean;
  allPartners?: boolean;
  sweepConfig?: boolean;
  atiPrimary?: boolean;
  wtPrimary?: boolean;
  verbose?: boolean;
};

const SUMMARY = `Product price-parity test — scores each product across three prices:
  gv  goovee invoice price (quoteProductPrice)
  so  the TRUE AOS sale-order / invoice line price (product onchange action,
      computed on a transient line — NO order is persisted)
  ep  AOS /ws/aos/product/price endpoint (only indicational)

gv ≠ so → FAILURE; gv == so but ep differs → PARTIAL (the known endpoint↔
invoice gap); all three agree → SUCCESS. Exits non-zero only on a failure.

Defaults sweep every sellable product, every company, one buyer per distinct
(fiscal position, currency, sale price list) + a no-buyer row, a curated
set of target currencies — a few European, a few distinct, and one with no
exchange rate (to show the error path): ${DEFAULT_CURRENCIES.join(', ')} — and
BOTH tax-basis orientations, since a line rounds its primary basis and derives
the other, so the two are separate code paths with separate answers. Quantity 1,
the product's own unit, and the pricing config as it stands, unless asked
otherwise.`;

type GooveePrice =
  | {
      ok: true;
      wt: number;
      ati: number;
      currencyCode: string;
      /** The billable line totals — the discounted unit price times the
       *  quantity, rounded to the currency. */
      exTaxTotal: number;
      inTaxTotal: number;
    }
  | {ok: false; error: string};

/* The quantities to price at, one pass each. A quantity is a real dimension,
 * not a scale factor: a price list's `minQty` thresholds mean a higher quantity
 * can select a DIFFERENT discount line, so qty 1 only ever reaches the lowest
 * tier. Within a pass the relationship stays explicit — the line total divided
 * by the quantity is the discounted unit price (relied on by eqTotalToUnit). */
const qtyOptions = (values: Values): BigDecimal[] =>
  values.qty && values.qty.length > 0 ? values.qty : [ONE];

/* Checked as it is read, then kept as the text it arrived as: a quantity goes
 * to BigDecimal, which a detour through a float would round first. Commander
 * hands a parser the values gathered so far, so a repeated flag accumulates
 * here rather than in the option. */
function readQuantity(
  value: string,
  gathered: BigDecimal[] = [],
): BigDecimal[] {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new InvalidArgumentError('must be a positive number.');
  }

  return [...gathered, BigDecimal.valueOf(value)];
}

function readCount(value: string): number {
  const count = Number(value);

  if (!Number.isInteger(count) || count <= 0) {
    throw new InvalidArgumentError('must be a positive integer.');
  }

  return count;
}

/* The units to quote in, one pass each. `null` is the product's own sale unit
 * and is always swept, so `--unit` widens the run instead of narrowing it to
 * the converted case (which `so` cannot validate — see the header). */
const unitOptions = (values: Values): (string | null)[] => [
  null,
  ...(values.unit ?? []),
];

/* The AppBase settings `--sweep-config` walks. The discount compute method
 * decides whether a price-list discount is folded into the unit price or left
 * separate for the total to apply, and the unit-price scale decides where every
 * intermediate result is rounded — so the two cross rather than compose. */
const CONFIG_SWEEP: Array<{
  computeMethodDiscountSelect: number;
  nbDecimalDigitForUnitPrice: number;
}> = [1, 2, 3].flatMap(computeMethodDiscountSelect =>
  [2, 4].map(nbDecimalDigitForUnitPrice => ({
    computeMethodDiscountSelect,
    nbDecimalDigitForUnitPrice,
  })),
);

/* Comparison tolerance and display only — every price this script compares has
 * already been rounded by the core. */
function round(value: number, scale: number): number {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

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
  qty,
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
  qty: BigDecimal;
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
      qty,
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
  config: {aos: TenantConfig['aos']};
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
    {headers: getAOSHeaders(config.aos)},
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
  qty,
}: {
  config: {aos: TenantConfig['aos']};
  productId: string;
  companyId: string;
  partnerId: string;
  fiscalPositionId: string | null;
  priceListId: string | null;
  currencyId: string;
  unitId: string | null;
  today: string;
  inAti: boolean;
  qty: BigDecimal;
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
          /* The same quantity gv priced at — a line's discount can depend on it
           * through the price list's `minQty` thresholds. */
          qty: qty.toNumber(),
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
    {headers: getAOSHeaders(config.aos)},
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
 *  line total ÷ qty is that same discounted unit-converted price, so the two are
 *  the comparable pair. */
function eqTotalToUnit(
  gv: GooveePrice,
  ep: PriceResult,
  nb: number,
  lineQty: BigDecimal,
): boolean {
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
  const qty = lineQty.toNumber();
  return (
    Math.abs(gv.exTaxTotal / qty - ep.wt) < eps &&
    Math.abs(gv.inTaxTotal / qty - ep.ati) < eps
  );
}

type RowStatus = 'success' | 'partial' | 'failure';

type Row = {
  status: RowStatus;
  /** Neither side could price this combination, so they agree only that it is
   *  unpriceable — scored a success, but it validates nothing. Counted separately
   *  so a run's success total can't be read as coverage it doesn't have. */
  unpriced: boolean;
  /** `ep` was left out of this row's verdict because the quantity would change
   *  the answer and `ep` has no quantity to give. Counted separately: for a
   *  buyer row `so` still decided it, but for a unit-converted row nothing did. */
  epExcluded: boolean;
  /** No reference at all was available — the row scored on nothing. */
  unreferenced: boolean;
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
 *  (success); exactly one errors → failure. Whether a price EXISTS does not
 *  depend on the quantity, so this stage always uses ep.
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
 *  doc), so `so` is not a valid reference: instead compare gv's per-unit line
 *  total against `ep`'s unit price — the one path that unit-converts. `ep` is
 *  indicational, so a mismatch is partial, never a failure.
 *
 *  `epQuantityBlind` — ep quotes as if for a single unit and cannot be told
 *  otherwise: its request carries no quantity, and it applies the price list at
 *  a hardcoded 1 (`ProductPriceListServiceImpl.getDiscountsFromPriceLists` →
 *  `getPriceListLine(product, ONE, …)`). At any other quantity a price list can
 *  select a different line — a `minQty` of 1 stops applying below 1 just as a
 *  `minQty` of 5 starts applying at 5 — so ep is then answering a different
 *  question and is dropped from the verdict rather than counted as a disagreement.
 *  Where no line's applicability differs between the two quantities, ep stays a
 *  valid reference. */
function compare3(
  product: PriceProduct,
  gv: GooveePrice,
  so: PriceResult | null,
  ep: PriceResult,
  nb: number,
  unitConverted: boolean,
  lineQty: BigDecimal,
  epQuantityBlind: boolean,
): Row {
  let status: RowStatus;
  let unreferenced = false;
  if (!gv.ok || !ep.ok) {
    status = !gv.ok && !ep.ok ? 'success' : 'failure';
  } else if (unitConverted) {
    /* ep is the ONLY reference for a unit-converted row, so when it is dropped
     * the row has nothing left to be checked against. */
    if (epQuantityBlind) {
      status = 'partial';
      unreferenced = true;
    } else {
      status = eqTotalToUnit(gv, ep, nb, lineQty) ? 'success' : 'partial';
    }
  } else if (so === null) {
    status = eq(gv, ep, nb) ? 'success' : 'partial';
  } else if (!eq(gv, so, nb) || !eqTotal(gv, so, nb)) {
    status = 'failure';
  } else {
    /* gv matches the real invoice line. ep only refines that to partial when it
     * is answering the same question. */
    status = epQuantityBlind || eq(gv, ep, nb) ? 'success' : 'partial';
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
    unpriced: !gv.ok && !ep.ok,
    /* Only the rows `so` went on to decide: an unreferenced row was left with no
     * reference at all, and is reported on its own line. */
    epExcluded: epQuantityBlind && gv.ok && ep.ok && !unreferenced,
    unreferenced,
    productId: product.id,
    name: (product.name ?? product.code ?? product.id).slice(0, 28),
    gv: fmt(gv),
    so: so === null || unitConverted ? 'n/a' : fmt(so),
    /* Say so in the column rather than printing a figure that was not scored. */
    ep: epQuantityBlind && gv.ok && ep.ok ? `${fmt(ep)} (qty1)` : fmt(ep),
    gvTot: fmtTot(gv),
    soTot: so === null || unitConverted ? 'n/a' : fmtTot(so),
  };
}

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

/** Up-front reachability check: the public app-info endpoint answers 200 when
 *  the back end is up. If it doesn't, tell the invoker plainly and stop — rather
 *  than failing deep in the sweep. After this passes the run assumes AOS is
 *  reachable and lets any later network error crash.
 *
 *  Sent with the same headers as the calls it vouches for: an instance serving
 *  several AOS tenants can refuse a request that selects none, which would
 *  report a healthy back end as unreachable. */
async function assertAosReachable(config: AosConfig): Promise<void> {
  const url = `${config.aos.url}/ws/public/app/info`;
  try {
    await axios.get(url, {timeout: 10_000, headers: getAOSHeaders(config.aos)});
  } catch (err) {
    const why = axios.isAxiosError(err)
      ? err.response
        ? `HTTP ${err.response.status}`
        : (err.code ?? 'no response')
      : String(err);
    out.fail(
      `AOS back end is not accessible at ${url} (${why}). Is it running?`,
    );
  }
}

/* The AppBase record `--sweep-config` rewrites between passes, over the same
 * REST resource the AOS client uses. It has to go through REST and not SQL: AOS
 * keeps the config in Hibernate's second-level cache, so a direct UPDATE would
 * leave the running instance pricing with the old value while our core read the
 * new one — every comparison after it would be meaningless. */
const APP_BASE_MODEL = 'com.axelor.studio.db.AppBase';

type AosConfig = {
  aos: TenantConfig['aos'];
};

type AppBaseSettings = {
  computeMethodDiscountSelect: number;
  nbDecimalDigitForUnitPrice: number;
};

type AppBaseRecord = {id: number; version: number} & AppBaseSettings;

async function readAppBase(config: AosConfig): Promise<AppBaseRecord> {
  const res = await axios.post(
    `${config.aos.url}/ws/rest/${APP_BASE_MODEL}/search`,
    {
      fields: [
        'version',
        'computeMethodDiscountSelect',
        'nbDecimalDigitForUnitPrice',
      ],
      data: {},
      limit: 1,
    },
    {headers: getAOSHeaders(config.aos)},
  );
  const record = res.data?.data?.[0];
  if (!record) {
    throw new Error(
      `Could not read ${APP_BASE_MODEL} over REST — needed to sweep the pricing config.`,
    );
  }
  return {
    id: Number(record.id),
    version: Number(record.version),
    computeMethodDiscountSelect: Number(record.computeMethodDiscountSelect),
    nbDecimalDigitForUnitPrice: Number(record.nbDecimalDigitForUnitPrice),
  };
}

/** Writes the two swept settings and returns the record's new version, so the
 *  next write can follow without re-reading. */
async function writeAppBase(
  config: AosConfig,
  current: {id: number; version: number},
  settings: AppBaseSettings,
): Promise<number> {
  const res = await axios.post(
    `${config.aos.url}/ws/rest/${APP_BASE_MODEL}`,
    {data: {id: current.id, version: current.version, ...settings}},
    {headers: getAOSHeaders(config.aos)},
  );
  const saved = res.data?.data?.[0];
  if (res.data?.status !== 0 || saved?.version == null) {
    throw new Error(
      `Could not write ${APP_BASE_MODEL}: ${JSON.stringify(res.data).slice(0, 300)}`,
    );
  }
  return Number(saved.version);
}

type Tally = {ok: number; part: number; fail: number};

function bump(
  map: Map<string, Tally>,
  key: string,
  succ: number,
  part: number,
  fail: number,
): void {
  const tally = map.get(key) ?? {ok: 0, part: 0, fail: 0};
  tally.ok += succ;
  tally.part += part;
  tally.fail += fail;
  map.set(key, tally);
}

/** Prints a per-dimension breakdown, but only when that dimension actually
 *  varied — a divergence confined to one value of it is otherwise buried in the
 *  combined total. */
function printTally(title: string, map: Map<string, Tally>): void {
  if (map.size < 2) return;
  console.log(`\n${BOLD}by ${title}${RESET}`);
  for (const [key, {ok, part, fail}] of map) {
    const colour = fail === 0 ? GREEN : RED;
    console.log(
      `  ${colour}${key}: ${ok} success / ${part} partial / ${fail} failure${RESET}`,
    );
  }
}

async function testPrices({
  client,
  config,
  tenantId,
  values,
}: TenantHandle & {values: Values}) {
  const QTY_OPTIONS = qtyOptions(values);
  const UNIT_OPTIONS = unitOptions(values);
  const verbose = Boolean(values.verbose);

  await assertAosReachable(config);

  const [companySpecificProductFields, unitConversions] = await Promise.all([
    loadCompanySpecificProductFields(client),
    values.unit?.length ? loadUnitConversions(client) : Promise.resolve([]),
  ]);

  const [products, companies, currencies, partners] = await Promise.all([
    loadProducts(client, {
      ids: values.product,
      allProducts: values.allProducts,
      limit: values.limit,
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
      allPartners: values.allPartners,
    }),
  ]);

  if (products.length === 0) throw new Error('No products to test.');
  if (companies.length === 0) throw new Error('No companies found.');

  /* A line rounds its primary basis and derives the other from the rounded
   * figure, so the two orientations are separate paths that can disagree with
   * AOS independently. Sweep both unless one is asked for. */
  const onlyAti = Boolean(values.atiPrimary);
  const onlyWt = Boolean(values.wtPrimary);
  const orientations: boolean[] =
    onlyAti === onlyWt ? [false, true] : onlyAti ? [true] : [false];
  if (currencies.length === 0)
    throw new Error('No target currencies resolved.');
  const currencyOptions: CurrencyRow[] = currencies;
  const priceListLinesCache = new Map<string, PriceListLineRow[]>();

  console.log(
    `\n${CYAN}→ tenant=${tenantId} products=${products.length} companies=${companies.length} ` +
      `partners=${partners.length} currencies=${currencies.map(c => c.code).join('/')} ` +
      `qty=${QTY_OPTIONS.map(quantity => quantity.toString()).join('/')} ` +
      `units=${UNIT_OPTIONS.map(unitId => unitId ?? 'own').join('/')}${RESET}`,
  );

  let totSuccess = 0;
  let totPartial = 0;
  let totFailure = 0;
  /* Successes where neither side could price the combination. They agree, but on
   * nothing — kept out of the headline so it reads as coverage, not just parity. */
  let totUnpriced = 0;
  /* Rows whose verdict left ep out because it prices at a hardcoded quantity of
   * 1 — and, of those, the ones ep was the only reference for. */
  let totEpExcluded = 0;
  let totUnreferenced = 0;
  /* Per-dimension tallies, so a divergence that only shows for one basis,
   * quantity, unit or config is attributable instead of buried in one total. */
  const perBasis = new Map<string, Tally>();
  const perQty = new Map<string, Tally>();
  const perUnit = new Map<string, Tally>();
  const perConfig = new Map<string, Tally>();
  const basisLabel = (ati: boolean) => (ati ? 'ATI' : 'WT');

  /* Without --sweep-config there is exactly one pass, on whatever AppBase
   * already holds — nothing is written. */
  const sweepConfig = Boolean(values.sweepConfig);
  const original = sweepConfig ? await readAppBase(config) : null;
  let appBaseVersion = original?.version ?? 0;
  const configPasses: (AppBaseSettings | null)[] = sweepConfig
    ? CONFIG_SWEEP
    : [null];

  /* Ctrl-C during a config pass would skip the restore below and leave the whole
   * instance on a swept setting, so put it back before exiting. The signal has to
   * be handled to reach an await, and the exit code is the conventional 128+n. */
  /* Held so every exit path can wait for it: the signal does not stop the sweep,
   * so without this the run could finish and call `process.exit` while the restore
   * is still in flight — ending clean and green with the instance still swept. */
  const signalRestore: {pending: Promise<void> | null} = {pending: null};
  const restoreOnSignal = (
    signal: 'SIGINT' | 'SIGTERM',
    signalNumber: number,
  ) =>
    process.on(signal, () => {
      /* A second signal must not start a second restore: the two would race on
       * the same record and the loser's version conflict would report a failure
       * that never happened. */
      if (signalRestore.pending) return;
      signalRestore.pending = (async () => {
        if (original) {
          const {id, computeMethodDiscountSelect, nbDecimalDigitForUnitPrice} =
            original;
          try {
            /* Read the record's version now rather than trusting the one this
             * run last wrote: a pass write may have committed in between, and a
             * stale version fails the lock and leaves the instance swept. */
            const live = await readAppBase(config);
            await writeAppBase(
              config,
              {id, version: live.version},
              {computeMethodDiscountSelect, nbDecimalDigitForUnitPrice},
            );
            console.log(
              `\n${DIM}${signal} — AppBase restored to ` +
                `method=${computeMethodDiscountSelect} nb=${nbDecimalDigitForUnitPrice}.${RESET}`,
            );
          } catch (err) {
            /* Say the value out loud: the run is ending either way, and an
             * un-restored setting silently changes what every later run prices
             * with. */
            console.error(
              `\n${RED}${signal} — could NOT restore AppBase. Set it back by hand: ` +
                `computeMethodDiscountSelect=${computeMethodDiscountSelect}, ` +
                `nbDecimalDigitForUnitPrice=${nbDecimalDigitForUnitPrice}.${RESET}`,
              err,
            );
          }
        }
        process.exit(128 + signalNumber);
      })();
    });
  if (sweepConfig) {
    restoreOnSignal('SIGINT', 2);
    restoreOnSignal('SIGTERM', 15);
  }

  try {
    for (const pass of configPasses) {
      if (pass && original) {
        appBaseVersion = await writeAppBase(
          config,
          {id: original.id, version: appBaseVersion},
          pass,
        );
      }
      /* Read our own side of the config back after the write, so both sides price
       * under the same settings. */
      const appConfig = await loadAppConfig(client);
      const nb = appConfig.nbDecimalForUnitPrice;
      const configLabel = `method=${appConfig.computeMethodDiscountSelect} nb=${nb}`;
      if (sweepConfig) {
        console.log(`\n${CYAN}══ config ${configLabel} ══${RESET}`);
      }

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

          /* Which products a given quantity selects a different discount line for
           * than ep's hardcoded 1 does. A line's applicability flips between the
           * two quantities exactly when its `minQty` sits above the lower and at
           * or below the higher — so this catches quantities BELOW 1 as well,
           * where a plain `minQty` of 1 applies for ep and not for the line being
           * priced. At quantity 1 the range is empty and ep always stands. */
          const flippingScopes = (lineQty: BigDecimal) => {
            const below = lineQty.compareTo(ONE) < 0;
            const lower = below ? lineQty : ONE;
            const upper = below ? ONE : lineQty;
            const productIds = new Set<string>();
            const categoryIds = new Set<string>();
            for (const line of priceListLines) {
              const minQty = toDecimalOrNull(line.minQty);
              if (minQty == null) continue;
              if (minQty.compareTo(lower) <= 0) continue;
              if (minQty.compareTo(upper) > 0) continue;
              if (line.product?.id) productIds.add(line.product.id);
              if (line.productCategory?.id) {
                categoryIds.add(line.productCategory.id);
              }
            }
            return {productIds, categoryIds};
          };

          for (const currencyOverride of currencyOptions) {
            /* Conversion lines for this combo: from each product currency to the
             * target (override) currency. */
            const conversionLines = await loadConversionLines(
              client,
              products.map(p => p.saleCurrency?.codeISO),
              [currencyOverride.codeISO],
            );

            const partnerId = partnerSample.id;
            const fiscalPositionId =
              partnerSample.partner?.fiscalPosition?.id ?? null;

            for (const unitId of UNIT_OPTIONS) {
              const requestedUnit = unitId ? {id: unitId} : null;

              /* `ep` (the batched endpoint) prices a unit in the requested unit but
               * has no basis orientation and no quantity, so one fetch per unit
               * serves every orientation and quantity below it. */
              const aosById = await fetchAosPrices({
                config,
                productIds: products.map(p => p.id),
                partnerId: partnerSample.id,
                companyId,
                currencyId: currencyOverride.id,
                unitId,
              });

              for (const atiPrimary of orientations) {
                for (const lineQty of QTY_OPTIONS) {
                  const flipping = flippingScopes(lineQty);

                  /* `so` (the per-product onchange) is per orientation, unit and
                   * quantity — it prices a transient line on an order of that basis.
                   * No buyer → no sale order to price against, so skip it (compared
                   * gv-vs-ep). Otherwise carry the buyer's fiscal position so the
                   * onchange applies the same tax remap a real order would. */
                  const sos = await processBatch(products, product =>
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
                          unitId,
                          today,
                          inAti: atiPrimary,
                          qty: lineQty,
                        }),
                  );

                  const rows = products.map((product, i) => {
                    /* Is ep still answering the same question for this product?
                     * Only a line that applies at one of the two quantities and
                     * not the other makes the quantity matter. */
                    const epQuantityBlind =
                      flipping.productIds.has(product.id) ||
                      (product.productCategory?.id != null &&
                        flipping.categoryIds.has(product.productCategory.id));
                    return compare3(
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
                        qty: lineQty,
                      }),
                      sos[i],
                      endpointResult(aosById.get(product.id)),
                      nb,
                      /* Did gv unit-convert this product? AOS invoice lines never
                       * unit-convert price (only the quick-price endpoint does), so
                       * when the requested unit differs from the sale unit `so`
                       * can't be the reference — validate gv against `ep` instead. */
                      requestedUnit != null &&
                        requestedUnit.id !==
                          (product.salesUnit?.id ?? product.unit?.id ?? null),
                      lineQty,
                      epQuantityBlind,
                    );
                  });

                  const failures = rows.filter(
                    r => r.status === 'failure',
                  ).length;
                  const part = rows.filter(r => r.status === 'partial').length;
                  const succ = rows.length - failures - part;
                  totSuccess += succ;
                  totPartial += part;
                  totFailure += failures;
                  totUnpriced += rows.filter(r => r.unpriced).length;
                  totEpExcluded += rows.filter(r => r.epExcluded).length;
                  totUnreferenced += rows.filter(r => r.unreferenced).length;

                  const basis = basisLabel(atiPrimary);
                  const qtyLabel = lineQty.toString();
                  const unitLabel = unitId ?? 'own';
                  bump(perBasis, basis, succ, part, failures);
                  bump(perQty, qtyLabel, succ, part, failures);
                  bump(perUnit, unitLabel, succ, part, failures);
                  bump(perConfig, configLabel, succ, part, failures);

                  const label =
                    `company=${company.name ?? companyId} buyer=${partnerSample.label} ` +
                    `cur=${currencyOverride.code} basis=${basis} qty=${qtyLabel} unit=${unitLabel}` +
                    (priceList ? ` [priceList ${priceList.id}]` : '');
                  const icon = failures
                    ? `${RED}✖`
                    : part
                      ? `${YELLOW}◐`
                      : `${GREEN}✔`;
                  console.log(
                    `\n${icon}${RESET} ${BOLD}${label}${RESET}  ` +
                      `${succ} ok / ${part} partial / ${failures} fail (of ${rows.length})`,
                  );
                  const visible = verbose
                    ? rows
                    : rows.filter(r => r.status !== 'success');
                  if (visible.length) renderRows(visible);
                }
              }
            }
          }
        }
      }
    }
  } finally {
    /* Put the instance back the way it was found, even on a crash — a run that
     * left AppBase mid-sweep would silently change what every later measurement
     * (and the running app) prices with. A signal already started its own restore,
     * and that one exits the process, so wait for it rather than writing twice. */
    if (signalRestore.pending) {
      await signalRestore.pending;
    } else if (original) {
      const {id, computeMethodDiscountSelect, nbDecimalDigitForUnitPrice} =
        original;
      try {
        appBaseVersion = await writeAppBase(
          config,
          {id, version: appBaseVersion},
          {computeMethodDiscountSelect, nbDecimalDigitForUnitPrice},
        );
        console.log(
          `\n${DIM}AppBase restored to method=${computeMethodDiscountSelect} ` +
            `nb=${nbDecimalDigitForUnitPrice}.${RESET}`,
        );
      } catch (err) {
        /* Name the values instead of only throwing: this runs while an earlier
         * error is on its way out, and a throw here would replace it and leave
         * nothing on screen saying the instance is still swept. */
        console.error(
          `\n${RED}Could NOT restore AppBase. Set it back by hand: ` +
            `computeMethodDiscountSelect=${computeMethodDiscountSelect}, ` +
            `nbDecimalDigitForUnitPrice=${nbDecimalDigitForUnitPrice}.${RESET}`,
          err,
        );
      }
    }
  }

  /* Break the totals down per swept dimension: a divergence that only appears
   * for one orientation, quantity, unit or config is otherwise invisible in the
   * combined figure. */
  printTally('basis', perBasis);
  printTally('quantity', perQty);
  printTally('unit', perUnit);
  printTally('config', perConfig);

  console.log(
    `\n${totFailure === 0 ? GREEN : RED}${totSuccess} success / ${totPartial} partial / ` +
      `${totFailure} failure across all combinations.${RESET}`,
  );
  /* Say plainly how much of that success validated nothing. Both sides refusing to
   * price a combination scores a success — agreement, but on no number — so a run
   * whose successes are mostly these has far less coverage than the total suggests. */
  if (totUnpriced > 0) {
    console.log(
      `${DIM}of which ${totUnpriced} priced on neither side (no rate, no tax config): ` +
        `agreement without a number.${RESET}`,
    );
  }
  /* And how much of it was scored without ep. At a quantity other than 1, a price
   * list whose applicable line changes makes ep answer a different question, so it
   * is dropped rather than counted as a disagreement — which makes those rows rest
   * on so alone. */
  if (totEpExcluded > 0) {
    console.log(
      `${DIM}${totEpExcluded} scored without ep (it prices at quantity 1 only): ` +
        `on the sale-order line alone.${RESET}`,
    );
  }
  if (totUnreferenced > 0) {
    console.log(
      `${RED}${totUnreferenced} had no reference at all (unit-converted at a ` +
        `quantity ep cannot answer for): not validated.${RESET}`,
    );
  }
  console.log('');

  if (totFailure > 0) {
    out.fail(`${totFailure} product(s) priced differently from AOS.`);
  }
}

runTenantScript<Values>({
  command: 'pnpm pricing:compare',
  title: 'Product price-parity test',
  explain: explainHttpFailure,
  summary: SUMMARY,
  options: command =>
    command
      .option(
        '--product <id...>',
        'Product id (repeatable). Default: all sellable products',
      )
      .option(
        '--company <id...>',
        'Selling company id (repeatable). Default: all companies',
      )
      .option(
        '--partner <id...>',
        'Buyer partner id (repeatable). Default: a sampled set',
      )
      .option('--currency <code...>', 'Target currency code or id (repeatable)')
      .option(
        '--unit <id...>',
        'ALSO quote every product in this unit id (repeatable)',
      )
      .option(
        '--qty <n...>',
        "Quantity to price at (repeatable, default 1). Each value is its own pass; above 1 it starts reaching the price list's minQty thresholds",
        readQuantity,
      )
      .option(
        '--limit <n>',
        'Cap the number of products (quick runs)',
        readCount,
      )
      .option('--all-products', 'Include non-sellable / all products')
      .option('--all-partners', 'Use every partner instead of the sampled set')
      .option(
        '--sweep-config',
        'Also sweep the two AppBase settings that change the answer: discount compute method (separate / include-replace-only / include) x unit-price scale (2 / 4). Each combination is WRITTEN to AppBase over REST before its pass and the original values restored at the end — six times the passes, so pair it with a product subset',
      )
      .option(
        '--ati-primary',
        'Sweep ONLY the ATI-oriented basis (round ATI, derive WT). Default with neither: both, reported separately',
      )
      .option(
        '--wt-primary',
        'Sweep ONLY the WT-oriented basis (round WT, derive ATI)',
      )
      .option('--verbose', 'Print every row, not only mismatches'),
  run: async ({values, openTenant}) =>
    testPrices({...(await openTenant()), values}),
});
