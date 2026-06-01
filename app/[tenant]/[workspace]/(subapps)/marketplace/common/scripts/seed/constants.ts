/* Single source of truth for the demo-data marker.
 *
 * Stamped on the natural key of everything the seed persists — product
 * slug, category/license code, compat-version name, and the screenshot/
 * bundle file paths — so reset can match it all with one `${DEMO_PREFIX}%`
 * LIKE, and seeded rows never collide with canonical reference data (a
 * real `MIT` license, `v9.0.0`, …). Display fields (category/license
 * `name`, compat `title`) stay bare so the demo UI reads naturally;
 * seed.json keeps bare values and the prefix is applied via `demoKey`.
 *
 * Change the prefix HERE and both the seed and reset scripts follow. */
export const DEMO_PREFIX = 'portal_mkt_demo_';

/** Prefix a bare seed key (slug, code, name) with the demo marker. */
export const demoKey = (value: string) => `${DEMO_PREFIX}${value}`;
