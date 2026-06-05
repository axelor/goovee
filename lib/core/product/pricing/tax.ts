/* Tax resolution and WT/ATI math — mirroring AOS
 * `AccountManagementServiceImpl.getTaxLineSet`, `FiscalPositionServiceImpl`
 * and `TaxService`.
 *
 * Which taxes apply: read the account-management row for the selling company
 * (product first, then its family; a product-level row with an empty tax list
 * is "accounting-only" and falls through to the family) → apply the buyer's
 * fiscal position (all-or-nothing: an equivalence whose source is EXACTLY the
 * product's tax set swaps the whole set) → pick one rate line per tax (the
 * active one, else the dated line whose window contains today), deduplicated. */

import type {ResolvedTaxLine} from './types';
import type {
  AccountManagementRow,
  FiscalPositionInput,
  PriceableProduct,
  TaxRow,
} from '../orm';
import {PriceComputationError} from './errors';
import {round} from './util';

/** Finds the account-management row (the "which taxes apply" config) for the
 *  selling company: first on the product itself, then on its product family.
 *  No company → no row.
 *
 *  Subtlety mirrored from AOS (`AccountManagementServiceImpl.getProductTax`): a
 *  product-level row whose tax list is EMPTY also falls through to the family.
 *  Admins sometimes add a product-level row purely for accounting overrides
 *  (sale account, journal) and still rely on the family for the taxes. */
function resolveAccountManagement(
  product: PriceableProduct,
  companyId: string | null | undefined,
): AccountManagementRow | null {
  if (companyId == null) return null;
  const pickForCompany = (
    list: readonly AccountManagementRow[] | null | undefined,
  ) => list?.find(am => am.company.id === companyId) ?? null;

  const productLevel = pickForCompany(product.accountManagementList);
  if (productLevel?.saleTaxSet && productLevel.saleTaxSet.length > 0) {
    return productLevel;
  }
  return pickForCompany(product.productFamily?.accountManagementList);
}

/** The product's sale taxes for this company, or — when nothing is configured
 *  anywhere — the ACCOUNT_MANAGEMENT_3 error, thrown at the same point AOS
 *  throws it. */
function getProductTaxSet(
  product: PriceableProduct,
  companyId: string | null | undefined,
): readonly TaxRow[] {
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

/** Applies the buyer's fiscal position: if one of its equivalences lists
 *  EXACTLY the product's tax set as its source (same tax ids — not a subset,
 *  not a superset), the whole set is replaced by that equivalence's target
 *  taxes. First match wins; no match keeps the original set.
 *
 *  The all-or-nothing comparison is the AOS rule
 *  (`FiscalPositionServiceImpl.getTaxSet` uses `Set.equals`). An equivalence
 *  covering only some of the product's taxes does nothing. */
function applyFiscalPosition(
  taxSet: readonly TaxRow[],
  fiscalPosition: FiscalPositionInput | null | undefined,
): readonly TaxRow[] {
  const equivs = fiscalPosition?.taxEquivList;
  if (!equivs || equivs.length === 0 || taxSet.length === 0) return taxSet;

  const taxIds = new Set(taxSet.map(t => t.id));
  for (const equiv of equivs) {
    const fromIds = (equiv.fromTaxSet ?? []).map(t => t.id);
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

/** Picks one rate line per tax and deduplicates the result
 *  (`TaxService.getTaxLineSet`).
 *
 *  Errors, at the same points as AOS: an empty input set → TAX_2; taxes present
 *  but none of them produced anything → TAX_1. A tax whose dated lines simply
 *  don't cover today is NOT an error — AOS records it as a null member and it
 *  contributes 0% (see `resolveTaxLine`). */
function getTaxLineSet(
  taxSet: readonly TaxRow[],
  today: string,
): ResolvedTaxLine[] {
  if (taxSet.length === 0) {
    throw new PriceComputationError('TAX_2', 'Empty tax set');
  }
  const byId = new Map<string, ResolvedTaxLine>();
  let hasNullMember = false;
  for (const tax of taxSet) {
    const resolved = resolveTaxLine(tax, today);
    if (resolved === undefined) continue;
    if (resolved === null) {
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

/** The full "which taxes apply" pipeline, mirroring
 *  `AccountManagementServiceImpl.getTaxLineSet`: read the product's tax set →
 *  apply the buyer's fiscal position → pick one rate line per tax. */
export function getSaleTaxLineSet({
  product,
  companyId,
  fiscalPosition,
  today,
}: {
  product: PriceableProduct;
  companyId: string | null | undefined;
  fiscalPosition: FiscalPositionInput | null | undefined;
  today: string;
}): ResolvedTaxLine[] {
  const taxSet = getProductTaxSet(product, companyId);
  const effectiveSet = applyFiscalPosition(taxSet, fiscalPosition);
  return getTaxLineSet(effectiveSet, today);
}

/** Picks the applicable rate line of ONE tax: the explicitly active line if the
 *  tax has one, otherwise the first dated line whose [startDate, endDate]
 *  window contains today.
 *
 *  Three possible outcomes, mirroring the AOS loop body exactly:
 *  - a line — found one;
 *  - `null` — the tax HAS dated lines but none covers today (AOS puts a literal
 *    null into its set; net effect: contributes 0%, no error);
 *  - `undefined` — the tax has no active line and no dated lines at all (AOS
 *    adds nothing; if EVERY tax ends up here, TAX_1 is thrown by the caller). */
function resolveTaxLine(
  tax: TaxRow,
  today: string,
): ResolvedTaxLine | null | undefined {
  const active = tax.activeTaxLine;
  if (active != null) {
    return {id: active.id, value: toNumberOrNull(active.value)};
  }
  const list = tax.taxLineList;
  if (!list || list.length === 0) return undefined;
  for (const line of list) {
    /* Dates are YYYY-MM-DD strings on both sides, so plain string comparison is
     * also chronological comparison. */
    if (today < line.startDate) continue;
    if (line.endDate != null && today > line.endDate) continue;
    return {id: line.id, value: toNumberOrNull(line.value)};
  }
  return null;
}

/** Total tax percentage: the plain sum of the picked lines' rates
 *  (`TaxService.getTotalTaxRateInPercentage`). E.g. VAT 20 + eco-tax 1.5 →
 *  21.5. */
export function getTotalTaxRateInPercentage(
  lineSet: readonly ResolvedTaxLine[],
): number {
  let total = 0;
  for (const line of lineSet) {
    if (line.value != null) total += line.value;
  }
  return total;
}

/** Derives both bases from one stored price (`taxRate` is a percentage, e.g. 20
 *  for 20%):
 *  - the stored price is ATI → WT = price / (1 + rate/100);
 *  - the stored price is WT  → ATI = WT + WT · rate/100.
 *  Same algebra as `TaxService.convertUnitPrice`, just producing both numbers
 *  at once instead of one per call. */
export function computeWtAti(
  price: number,
  inAti: boolean,
  taxRate: number,
): {wt: number; ati: number} {
  if (inAti) {
    return {
      ati: price,
      wt: taxRate === 0 ? price : price / (1 + taxRate / 100),
    };
  }
  return {wt: price, ati: price + (price * taxRate) / 100};
}

/** Converts a unit price from one tax basis to the other, mirroring
 *  `TaxService.convertUnitPrice`: given the price IS in the `priceIsAti` basis,
 *  return it in the opposite basis, rounded half-up to `scale`. (`taxRate` is a
 *  percentage; rate 0 is identity.) Unlike `computeWtAti`, which yields both
 *  bases unrounded, this is the single-direction, rounded primitive AOS reuses
 *  when re-expressing an already-resolved price — e.g. around the price-list
 *  step (`applyPriceList`). */
export function convertUnitPrice(
  priceIsAti: boolean,
  taxRate: number,
  price: number,
  scale: number,
): number {
  const rate = taxRate / 100;
  if (priceIsAti) return round(price / (1 + rate), scale);
  return round(price + price * rate, scale);
}

/** Rounds a WT/ATI unit-price pair the way an AOS sale-order / invoice line
 *  stores it — which is the number that actually gets INVOICED, and is NOT what
 *  the `/ws/aos/product/price` endpoint returns (see `apply-price-list.ts`). A
 *  line has ONE primary basis (the order's `inAti` orientation): that basis is
 *  rounded to `scale`, and the OTHER basis is then derived FROM the rounded
 *  primary via `convertUnitPrice` — not rounded independently. So a WT line
 *  stores `price = round(wt)` and `inTaxPrice = convertUnitPrice(false, rate,
 *  price)`, and an ATI line does the mirror.
 *
 *  This deriving-from-the-rounded-primary is why the invoice can differ by a
 *  cent from an independent round of each basis: e.g. WT 360.8748 → 360.87,
 *  then ATI = 360.87 × 1.2 = 433.044 → 433.04 (an independent round of the
 *  514.80×rate ATI would give 433.05). Feed the unrounded `wt`/`ati`/`taxRate`
 *  from `getConvertedPrice`/`getSaleUnitPrice`; get back the invoice pair. */
export function roundSaleUnitPrice(
  {wt, ati, taxRate}: {wt: number; ati: number; taxRate: number},
  primaryInAti: boolean,
  scale: number,
): {wt: number; ati: number} {
  if (primaryInAti) {
    const atiRounded = round(ati, scale);
    return {
      ati: atiRounded,
      wt: convertUnitPrice(true, taxRate, atiRounded, scale),
    };
  }
  const wtRounded = round(wt, scale);
  return {
    wt: wtRounded,
    ati: convertUnitPrice(false, taxRate, wtRounded, scale),
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
