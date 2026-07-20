/* Product pricing core — a faithful TypeScript port of the AOS sale pricing
 * path. Computing a price here gives the same number AOS would invoice.
 *
 * The module is subapp-agnostic: it knows nothing about any subapp. Its input
 * types are the `Payload` types of the select fragments in the co-located data
 * layer (`../orm`) — so adding a field a function reads means extending one
 * fragment, no second edit. It depends only on types it owns (its own `orm`
 * over the goovee ORM), never on a subapp. It is strict — it throws
 * `PriceComputationError` wherever the mirrored AOS Java throws; degradation
 * policy belongs to the caller.
 *
 * Split by concern (this folder); see PRICING.md for the narrative:
 * - types / errors   — input shapes, enums, error codes, the error class.
 * - util             — rounding, timezone "today", per-company field reads.
 * - tax              — tax resolution, WT/ATI, basis conversion + pairing.
 * - conversion       — currency exchange rate, unit coefficient.
 * - discount         — the buyer's price-list discount primitives.
 * - line-total       — the billable `exTaxTotal` / `inTaxTotal`.
 * - catalogue        — `getSaleUnitPrice` / `getConvertedPrice`.
 * - apply-price-list — the product-price ENDPOINT's quirky variant (reference).
 * - quote            — `quoteProductPrice`: the one call for display + charge. */

export * from './types';
export * from './errors';
export * from './util';
export * from './tax';
export * from './conversion';
export * from './discount';
export * from './line-total';
export * from './catalogue';
export * from './apply-price-list';
export * from './quote';
