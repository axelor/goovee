/* Marketplace price compute — single source of truth for every price-
 * related calculation in the marketplace subapp. All WT/ATI math and the
 * Paid/Free predicate so that display values stay in lockstep with what
 * AOS will invoice.
 *
 * The computation is split in two layers:
 *   - a STRICT core that mirrors the AOS Java logic step by step,
 *     including its failure modes (it throws `PriceComputationError`
 *     with the matching AOS error code where AOS throws an
 *     `AxelorException`);
 *   - a LENIENT wrapper (`computePrice`) that catches those errors and
 *     degrades gracefully for display: unresolvable tax → rate 0,
 *     unconvertible currency → next target → product currency as-is.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Strict-core algorithm (one-to-one with AOS)
 * ──────────────────────────────────────────────────────────────────────
 *   1. Resolve the price-defining fields (`salePrice`, `inAti`,
 *      `saleCurrency`). If `priceOverride` is provided, use it as-is —
 *      the override layer is sealed and never falls through. Otherwise
 *      resolve each field like `ProductCompanyService.get`: only when
 *      the field is flagged company-specific
 *      (`appBase.companySpecificProductFieldsSet`) is the
 *      `productCompanyList` row for the selling company consulted — and
 *      when a row matches, the field is read off that row with NO
 *      fallback to the base product; otherwise the base product field
 *      is used.
 *   2. Resolve the sale tax set by walking
 *      Product.accountManagementList → ProductFamily.accountManagementList,
 *      filtered by the selling company's id. A Product-level row whose
 *      `saleTaxSet` is empty falls through to the family (accounting-only
 *      override). Nothing resolvable → ACCOUNT_MANAGEMENT_3.
 *   3. If a buyer fiscal position is provided, swap the WHOLE tax set:
 *      the first `taxEquiv` whose `fromTaxSet` EQUALS the product's
 *      entire tax set (and has a non-empty `toTaxSet`) replaces it with
 *      its `toTaxSet`. No equiv matches → the original set is kept.
 *      (`FiscalPositionServiceImpl.getTaxSet` — set equality, not
 *      per-tax membership.)
 *   4. Resolve one tax line per tax, like `TaxService.getTaxLineSet`:
 *      prefer `activeTaxLine`; otherwise the first `taxLineList` entry
 *      whose [startDate, endDate] window contains today (computed in
 *      the company's IANA timezone). Collect the lines into a SET (a
 *      line shared by two taxes counts once). Nothing collected →
 *      TAX_1. The total rate is the sum of the unique lines' values.
 *   5. If `inAti`, invert: WT = salePrice / (1 + rate/100), ATI =
 *      salePrice. Otherwise forward: WT = salePrice, ATI = WT + WT·rate/100.
 *   6. Convert WT and ATI using `CurrencyConversionLine`s matched on the
 *      currencies' ISO code (`codeISO`, as in
 *      `CurrencyServiceImpl.getCurrencyConversionLine`): a direct
 *      from→to line valid today, else the inverse line with the rate
 *      inverted. No line → CURRENCY_1; zero/invalid rate → CURRENCY_2.
 *   7. Round both to the resolved currency's `numberOfDecimals`
 *      (defaults to DEFAULT_CURRENCY_SCALE).
 *
 * ──────────────────────────────────────────────────────────────────────
 * Lenient-wrapper currency resolution (marketplace display policy)
 * ──────────────────────────────────────────────────────────────────────
 *   - productCurrency — the product's own `saleCurrency`, stamped at
 *     creation from the publisher's partner currency (falling back to
 *     DEFAULT_CURRENCY_CODE) and never overwritten on later edits. This
 *     is the source currency and the last-resort display fallback.
 *   - viewerCurrency — `AOSPartner.currency` on `auth.user.mainPartnerId`
 *     (contacts share the parent partner's currency). First conversion
 *     target when present.
 *   - defaultCurrency — the app-wide `DEFAULT_CURRENCY_CODE` looked up
 *     in `AOSCurrency`. Second conversion target — used when the viewer
 *     conversion has no matching line, or when there is no viewer.
 *
 *   AOS itself resolves a SINGLE target (partner currency or an explicit
 *   one) and hard-fails when no line exists; the ordered cascade with a
 *   silent fallback is a marketplace display policy layered on top of
 *   the strict converter.
 *
 * ──────────────────────────────────────────────────────────────────────
 * AOS Java path mirrored
 * ──────────────────────────────────────────────────────────────────────
 *   axelor-sale/.../ProductRestService.fetchProductPrice
 *     → axelor-base/.../ProductPriceServiceImpl.getSaleUnitPrice
 *     → axelor-base/.../AccountManagementServiceImpl.getTaxLineSet
 *     → axelor-base/.../FiscalPositionServiceImpl.getTaxSet
 *     → axelor-base/.../TaxService.getTaxLineSet + convertUnitPrice
 *     → axelor-base/.../CurrencyServiceImpl.getAmountCurrencyConvertedAtDate
 *     → axelor-base/.../ProductCompanyServiceImpl.get
 *
 * ──────────────────────────────────────────────────────────────────────
 * Remaining differences vs AOS (precision only — logic is mirrored)
 * ──────────────────────────────────────────────────────────────────────
 *   - No PriceList / PriceListLine adjustment. AOS applies the buyer's
 *     `salePartnerPriceList` to override unit prices (discount, markup,
 *     replacement). Marketplace surfaces the catalog price; partners
 *     with a sale price list will diverge silently. Either mirror this
 *     or guard at validateCart against `buyer.salePartnerPriceList`.
 *   - No unit conversion. AOS's `/aos/product/price` accepts `unitId`
 *     and converts via `Unit.conversion`. Marketplace always sells at
 *     qty=1 in the product's natural unit, so this never fires.
 *   - Rounding scale is the resolved currency's `numberOfDecimals` (typically
 *     2) rather than `appConfig.nbDecimalDigitForUnitPrice` (often 4).
 *     With qty=1 the totals converge at the cent; multi-line inversions
 *     could theoretically drift by sub-cent.
 *   - Intermediate arithmetic is float64 rather than BigDecimal, and the
 *     exchange rate is applied unscaled where AOS re-scales it to 6
 *     decimals (8 for an inverted rate). For positive prices and tax
 *     rates `Math.round` matches HALF_UP, so the rounded result matches
 *     AOS at currency precision; cent-level drift is only theoretically
 *     possible at extreme magnitudes.
 */

import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import type {
  TaxRow,
  AccountManagementRow,
  ConversionLine,
  FiscalPositionInput,
  PriceableProduct,
  PriceContext,
  Currency,
} from '../orm';
const DEFAULT_TAX_RATE = 0;

/** AOS error codes raised by the strict core, one per `AxelorException`
 *  site in the mirrored Java path. */
export type PriceComputationErrorCode =
  /** No sale tax resolvable for the product/company (AccountManagementServiceImpl). */
  | 'ACCOUNT_MANAGEMENT_3'
  /** No usable tax line for any tax in the set (TaxService.getTaxLineSet). */
  | 'TAX_1'
  /** Empty tax set passed to tax-line resolution (TaxService.getTaxLineSet). */
  | 'TAX_2'
  /** No conversion line in either direction (CurrencyServiceImpl). */
  | 'CURRENCY_1'
  /** Conversion line found but its rate is zero/unusable (CurrencyServiceImpl). */
  | 'CURRENCY_2';

export class PriceComputationError extends Error {
  constructor(
    public readonly code: PriceComputationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PriceComputationError';
  }
}

export type ComputedPrice = {
  /** Without tax. */
  wt: number;
  /** All taxes included. */
  ati: number;
  /** Total applied tax rate as a percentage. Sum across all matched tax lines. */
  taxRate: number;
  /** Currency in which wt/ati are expressed: viewer's partner currency
   *  if conversion succeeded, otherwise the product's own currency. */
  currency: {code: string; symbol: string; numberOfDecimals: number};
};

/** Compute the wt and ati prices, tax rate and display currency for a product.
 *
 *  Layering of price-defining fields (top wins):
 *    1. `priceOverride`        — marketplace listing layer, optional
 *    2. `productCompanyList`   — per-company override on the Product,
 *                                only for fields flagged company-specific
 *    3. base Product fields
 *
 *  Currency display resolution (in order, first hit wins):
 *    1. viewerCurrency — if a productCurrency→viewer conversion line exists
 *    2. defaultCurrency — if a productCurrency→default conversion line exists
 *    3. productCurrency — last-resort, displayed as-is */
export function computePrice({
  product,
  priceContext,
  company,
  priceOverride,
}: {
  product: PriceableProduct;
  priceContext: PriceContext;
  company: {id: string; timezone: string | null} | null;
  /** Override layer — fully sealed when provided. All three fields
   *  must be present; none fall back through `productCompanyList` or
   *  the base product. The fallback path runs only when there's no
   *  `priceOverride`. Tax / accountManagement always come from the
   *  product itself; this layer overrides only price, inAti, and
   *  currency. */
  priceOverride?: {
    salePrice: NonNullable<PriceableProduct['salePrice']>;
    saleCurrency: NonNullable<PriceableProduct['saleCurrency']>;
    inAti: NonNullable<PriceableProduct['inAti']>;
  };
}): ComputedPrice {
  const {
    viewerCurrency,
    defaultCurrency,
    conversionLines,
    fiscalPosition,
    companySpecificProductFields,
  } = priceContext;
  const {id: companyId, timezone: companyTimezone} = company || {};

  const today = todayInTimezone(companyTimezone);

  const base = priceOverride ?? {
    salePrice: resolveProductField(
      product,
      'salePrice',
      companyId,
      companySpecificProductFields,
    ),
    inAti: resolveProductField(
      product,
      'inAti',
      companyId,
      companySpecificProductFields,
    ),
    saleCurrency: resolveProductField(
      product,
      'saleCurrency',
      companyId,
      companySpecificProductFields,
    ),
  };

  const {salePrice: _salePrice, inAti, saleCurrency} = base;
  const salePrice = Number(_salePrice ?? 0);

  /* Strict tax pipeline; any AOS-style failure degrades to rate 0 for
   * display instead of failing the page. */
  let taxRate: number;
  try {
    const taxSet = getProductTaxSet(product, companyId);
    const effectiveSet = applyFiscalPosition(taxSet, fiscalPosition);
    const lineSet = getTaxLineSet(effectiveSet, today);
    taxRate = getTotalTaxRateInPercentage(lineSet);
  } catch (e) {
    if (!(e instanceof PriceComputationError)) throw e;
    taxRate = DEFAULT_TAX_RATE;
  }

  let wt: number;
  let ati: number;
  if (inAti) {
    ati = salePrice;
    wt = taxRate === 0 ? salePrice : salePrice / (1 + taxRate / 100);
  } else {
    wt = salePrice;
    ati = wt + (wt * taxRate) / 100;
  }

  const lines = conversionLines ?? [];
  const fromCode = saleCurrency?.codeISO;
  let resolvedCurrency = saleCurrency;
  let convertedWt = wt;
  let convertedAti = ati;
  let resolvedScale = saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;

  if (fromCode) {
    /* A target equal to the product currency is kept — it converts at
     * rate 1, so a viewer whose currency matches the product's sees the
     * price as-is instead of falling through to the default currency. */
    const seen = new Set<string>();
    const targets = [viewerCurrency, defaultCurrency].filter(
      (c): c is Currency => {
        if (!c?.codeISO || seen.has(c.codeISO)) return false;
        seen.add(c.codeISO);
        return true;
      },
    );
    for (const target of targets) {
      const wtResult = tryConvert(wt, fromCode, target, today, lines);
      const atiResult = tryConvert(ati, fromCode, target, today, lines);
      if (wtResult && atiResult) {
        convertedWt = wtResult.value;
        convertedAti = atiResult.value;
        resolvedCurrency = target;
        resolvedScale = target.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;
        break;
      }
    }
  }

  return {
    wt: round(convertedWt, resolvedScale),
    ati: round(convertedAti, resolvedScale),
    taxRate,
    currency: {
      code: resolvedCurrency?.code ?? '',
      symbol: resolvedCurrency?.symbol ?? '',
      numberOfDecimals: resolvedScale,
    },
  };
}

/** Mirrors `ProductCompanyServiceImpl.get` for one field: the
 *  per-company override row is consulted ONLY when the field is flagged
 *  company-specific (`appBase.companySpecificProductFieldsSet`), and
 *  when a row matches the company the field is read off that row with
 *  no fallback to the base product — a null on the row stays null. */
function resolveProductField<K extends 'salePrice' | 'inAti' | 'saleCurrency'>(
  product: PriceableProduct,
  fieldName: K,
  companyId: string | null | undefined,
  companySpecificProductFields: string[],
): PriceableProduct[K] {
  if (!companySpecificProductFields.includes(fieldName)) {
    return product[fieldName];
  }
  if (companyId != null) {
    const row = product.productCompanyList?.find(
      pc => pc?.company?.id === companyId,
    );
    if (row) return row[fieldName] as PriceableProduct[K];
  }
  return product[fieldName];
}

/** AOS-style resolution: try the product's own `accountManagementList`
 *  first, fall back to the product family's. Matches the Java path in
 *  `AccountManagementServiceImpl.getProductTax` (CONFIG_OBJECT_PRODUCT
 *  → CONFIG_OBJECT_PRODUCT_FAMILY) — both lists are filtered by the
 *  selling company; no company → no row.
 *
 *  AOS falls through to family not just when the Product-level AM is
 *  absent, but also when it's present-but-has-empty-`saleTaxSet`. That
 *  accommodates admins who add a Product-level AM purely for accounting
 *  overrides (sale account, journal) and rely on the family for the tax
 *  set. */
function resolveAccountManagement(
  product: PriceableProduct,
  companyId: string | null | undefined,
): AccountManagementRow | null {
  if (companyId == null) return null;
  const pickForCompany = (list: AccountManagementRow[] | null | undefined) =>
    list?.find(am => am?.company?.id === companyId) ?? null;

  const productLevel = pickForCompany(product.accountManagementList);
  if (productLevel?.saleTaxSet && productLevel.saleTaxSet.length > 0) {
    return productLevel;
  }
  return pickForCompany(product.productFamily?.accountManagementList);
}

/** Strict mirror of `AccountManagementServiceImpl.getProductTax`:
 *  resolves the product's sale tax set for the company, throwing
 *  ACCOUNT_MANAGEMENT_3 when nothing is configured — exactly where AOS
 *  raises its `AxelorException`. */
function getProductTaxSet(
  product: PriceableProduct,
  companyId: string | null | undefined,
): TaxRow[] {
  const accountManagement = resolveAccountManagement(product, companyId);
  const taxSet = accountManagement?.saleTaxSet;
  if (!taxSet || taxSet.length === 0) {
    throw new PriceComputationError(
      'ACCOUNT_MANAGEMENT_3',
      'No sale tax configured for the product/company',
    );
  }
  return taxSet;
}

/** Mirrors `FiscalPositionServiceImpl.getTaxSet`: the first equivalence
 *  whose `fromTaxSet` EQUALS the product's entire tax set (and has a
 *  non-empty `toTaxSet`) replaces the whole set with its `toTaxSet`.
 *  Set equality is by tax ids — not per-tax membership. No match (or no
 *  fiscal position) keeps the original set. */
function applyFiscalPosition(
  taxSet: TaxRow[],
  fiscalPosition: FiscalPositionInput | null | undefined,
): TaxRow[] {
  const equivs = fiscalPosition?.taxEquivList;
  if (!equivs || equivs.length === 0 || taxSet.length === 0) return taxSet;

  const taxIds = new Set(
    taxSet.map(t => t?.id).filter((id): id is string => id != null),
  );
  for (const equiv of equivs) {
    const fromIds = (equiv?.fromTaxSet ?? [])
      .map(t => t?.id)
      .filter((id): id is string => id != null);
    if (
      fromIds.length > 0 &&
      fromIds.length === taxIds.size &&
      fromIds.every(id => taxIds.has(id)) &&
      equiv.toTaxSet &&
      equiv.toTaxSet.length > 0
    ) {
      return equiv.toTaxSet;
    }
  }
  return taxSet;
}

/** One resolved tax line. AOS collects `TaxLine` entities; we only need
 *  the identity (for set semantics) and the value. */
type ResolvedTaxLine = {id: string | null; value: number | null};

/** Strict mirror of `TaxService.getTaxLineSet`: per tax, prefer
 *  `activeTaxLine`; otherwise (when it has dated lines) the first
 *  `taxLineList` entry whose window contains `today` — or an explicit
 *  null member when none matches, exactly like AOS's
 *  `findFirst().orElse(null)`. Lines are deduplicated by id (AOS uses a
 *  `HashSet<TaxLine>`, so a line shared by two taxes counts once).
 *  Throws TAX_2 on an empty input set and TAX_1 when no tax contributed
 *  anything. */
function getTaxLineSet(taxSet: TaxRow[], today: string): ResolvedTaxLine[] {
  if (taxSet.length === 0) {
    throw new PriceComputationError('TAX_2', 'Empty tax set');
  }
  const byId = new Map<string, ResolvedTaxLine>();
  let hasNullMember = false;
  for (const tax of taxSet) {
    const resolved = resolveTaxLine(tax, today);
    if (resolved === undefined) continue;
    if (resolved === null || resolved.id == null) {
      hasNullMember = true;
      continue;
    }
    byId.set(resolved.id, resolved);
  }
  if (byId.size === 0 && !hasNullMember) {
    throw new PriceComputationError(
      'TAX_1',
      'No usable tax line for the tax set',
    );
  }
  return [...byId.values()];
}

/** Per-tax line pick, mirroring the loop body of
 *  `TaxService.getTaxLineSet`. Returns:
 *  - the line — `activeTaxLine`, or the first date-matching entry;
 *  - `null` — the tax HAS dated lines but none covers today (AOS adds a
 *    null member to the set);
 *  - `undefined` — the tax has neither an active line nor any dated
 *    lines (AOS adds nothing). */
function resolveTaxLine(
  tax: TaxRow,
  today: string,
): ResolvedTaxLine | null | undefined {
  const active = tax.activeTaxLine;
  if (active != null) {
    return {id: active.id ?? null, value: toNumberOrNull(active.value)};
  }
  const list = tax.taxLineList;
  if (!list || list.length === 0) return undefined;
  for (const line of list) {
    // ISO date string compare works because both sides are YYYY-MM-DD.
    const start = line?.startDate ?? null;
    const end = line?.endDate ?? null;
    if (start != null && today < start) continue;
    if (end != null && today > end) continue;
    return {id: line?.id ?? null, value: toNumberOrNull(line?.value)};
  }
  return null;
}

/** Mirrors `TaxService.getTotalTaxRateInPercentage`: plain sum of the
 *  unique resolved lines' values (null values contribute nothing). */
function getTotalTaxRateInPercentage(lineSet: ResolvedTaxLine[]): number {
  let total = 0;
  for (const line of lineSet) {
    if (line.value != null) total += line.value;
  }
  return total;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Returns today's date as `YYYY-MM-DD` in the given IANA timezone, falling
 *  back to the server clock when no zone (or an invalid zone) is supplied.
 *  Mirrors AOS's `AppBaseService.getTodayDate(company)` which always reads
 *  `company.timezone` before resolving "today" for tax / pricing purposes.
 *
 *  `en-CA` is a deliberate pick: it's the locale that natively formats
 *  dates as `YYYY-MM-DD`, exactly matching the shape AOS stores in
 *  `AOSTaxLine.startDate` / `endDate`, so the date-window check can be a
 *  plain lexicographic string compare with no parsing. */
function todayInTimezone(timezone: string | null | undefined): string {
  if (!timezone) return new Date().toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    // Invalid IANA string on the company row — don't fail rendering; fall
    // back to UTC server time. Misconfiguration will be visible at the
    // edges of midnight rollovers, same as if the field were unset.
    return new Date().toISOString().slice(0, 10);
  }
}

export function round(value: number, scale: number): number {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

/** Strict mirror of `CurrencyServiceImpl.getCurrencyConversionRateAtDate`:
 *  look for a direct from→to line; if none, take the inverse line and
 *  invert the rate. Lines are matched on `codeISO` — the unique ISO code
 *  AOS keys on — never the printing `code`. Throws CURRENCY_1 when
 *  neither direction has a line, CURRENCY_2 when the line's rate is
 *  zero/unusable. */
function getExchangeRate(
  fromCode: string,
  toCode: string,
  today: string,
  lines: ConversionLine[],
): number {
  if (fromCode === toCode) return 1;

  const matchLine = (start: string, end: string) =>
    lines.find(l => {
      if (l.startCurrency?.codeISO !== start || l.endCurrency?.codeISO !== end)
        return false;
      // fromDate/toDate are PG `date` columns (YYYY-MM-DD); lex compare = chronological.
      if (l.fromDate && today < l.fromDate) return false;
      if (l.toDate && today > l.toDate) return false;
      return true;
    });

  const direct = matchLine(fromCode, toCode);
  if (direct != null) {
    const rate = Number(direct.exchangeRate);
    if (!Number.isFinite(rate) || rate === 0) {
      throw new PriceComputationError(
        'CURRENCY_2',
        `Unusable exchange rate for ${fromCode} → ${toCode}`,
      );
    }
    return rate;
  }

  const inverse = matchLine(toCode, fromCode);
  if (inverse != null) {
    const rate = Number(inverse.exchangeRate);
    if (!Number.isFinite(rate) || rate === 0) {
      throw new PriceComputationError(
        'CURRENCY_2',
        `Unusable exchange rate for ${toCode} → ${fromCode}`,
      );
    }
    return 1 / rate;
  }

  throw new PriceComputationError(
    'CURRENCY_1',
    `No conversion line between ${fromCode} and ${toCode}`,
  );
}

/** Lenient conversion attempt used by the display cascade: converts
 *  `amount` from `fromCode` to `toCurrency`, or returns null when the
 *  strict converter raises (caller falls through to the next target). */
function tryConvert(
  amount: number,
  fromCode: string,
  toCurrency: Currency,
  today: string,
  lines: ConversionLine[],
): {value: number; currency: Currency} | null {
  if (!toCurrency.codeISO) return null;
  try {
    const rate = getExchangeRate(fromCode, toCurrency.codeISO, today, lines);
    return {value: amount * rate, currency: toCurrency};
  } catch (e) {
    if (!(e instanceof PriceComputationError)) throw e;
    return null;
  }
}

/** Paid/Free predicate — accepts either a raw `salePrice` (form context)
 *  or a computed `price.ati` (display context). Anything > 0 is Paid;
 *  everything else — null, 0, negative, non-numeric — is Free. */
export function isPaid(value: number | string | null | undefined): boolean {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0;
}
