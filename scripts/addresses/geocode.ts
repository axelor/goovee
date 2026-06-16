import '@/load-swc-env';

import type {GooveeClient} from '@/goovee/.generated/client';
import {manager} from '@/tenant';
import {getAOSAuthHeaders} from '@/tenant/auth';
import axios from 'axios';
import {parseArgs} from 'node:util';

/* The AOS per-record action that geocodes an address and writes latit/longit.
 * The geocoding provider (Open Street Map by default, or Google Maps) is set
 * in App Base, so this script does not talk to any map service directly. */
const ACTION = 'action-base-address-method-update-lat-long';
const MODEL = 'com.axelor.apps.base.db.Address';

const PAGE_SIZE = 500;

/* Open Street Map / Nominatim allows about one request per second, so requests
 * are paced by default. Configurable via --interval. */
const DEFAULT_INTERVAL_MS = 1200;

/* `pnpm <script> -- --flag` forwards a bare `--` as its own argv token, which
 * parseArgs would treat as the positional separator. Strip it so both
 * `pnpm addresses:geocode --help` and `pnpm addresses:geocode -- --help` work. */
const args = process.argv.slice(2).filter(arg => arg !== '--');

const {values} = parseArgs({
  args,
  options: {
    tenant: {type: 'string'},
    force: {type: 'boolean'},
    limit: {type: 'string'},
    interval: {type: 'string'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Address Geocoder

Generates latitude/longitude for portal addresses by calling the AOS
"${ACTION}" action per record, which geocodes via the provider configured in
App Base (Open Street Map by default, or Google Maps). By default only
addresses missing coordinates are processed.

An address whose location cannot be resolved is left without coordinates, so
the final coverage can be lower than the number of records processed.

Usage:
  pnpm addresses:geocode [options]

Options:
  --tenant <id>     Tenant id (defaults to 'd' when MULTI_TENANCY=false)
  --force           Re-geocode every address, not just those missing coordinates
  --limit <n>       Process at most n addresses
  --interval <ms>   Delay between requests in milliseconds (default ${DEFAULT_INTERVAL_MS})
  --help            Show this help
`);
  process.exit(0);
}

function fail(message: string): never {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
  process.exit(1);
}

const tenantId =
  values.tenant ?? (process.env.MULTI_TENANCY === 'true' ? undefined : 'd');
if (!tenantId) fail('--tenant is required (or set MULTI_TENANCY=false).');

const interval = values.interval
  ? Number(values.interval)
  : DEFAULT_INTERVAL_MS;
if (!Number.isFinite(interval) || interval < 0) {
  fail('--interval must be a non-negative number of milliseconds.');
}

const limit = values.limit ? Number(values.limit) : undefined;
if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
  fail('--limit must be a positive integer.');
}

const sleep = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

/* Page through addresses and return their ids. When `onlyMissing` is set, only
 * addresses without both coordinates are returned. `max` caps the result. */
async function collectAddressIds(
  client: GooveeClient,
  onlyMissing: boolean,
  max?: number,
): Promise<string[]> {
  const ids: string[] = [];

  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await client.aOSAddress.find({
      ...(onlyMissing ? {where: {OR: [{latit: null}, {longit: null}]}} : {}),
      select: {id: true},
      orderBy: {id: 'ASC'},
      take: PAGE_SIZE,
      skip,
    });

    for (const address of page) ids.push(address.id);

    if (page.length < PAGE_SIZE) break;
    if (max !== undefined && ids.length >= max) break;
  }

  return max !== undefined ? ids.slice(0, max) : ids;
}

async function main() {
  const tenant = await manager.getTenant(tenantId!);
  if (!tenant) fail(`Tenant '${tenantId}' not found.`);

  const {client, config} = tenant;
  const aos = config.aos;
  if (!aos?.url) fail(`AOS url not configured for tenant '${tenantId}'.`);

  const headers = {
    ...getAOSAuthHeaders(aos.auth),
    'Content-Type': 'application/json',
  };
  const endpoint = `${aos.url}/ws/action/${ACTION}`;

  const targets = await collectAddressIds(client, !values.force, limit);

  if (targets.length === 0) {
    const suffix = values.force
      ? ''
      : ' (all already have coordinates; use --force to redo)';
    console.log(
      `\x1b[36m→ Tenant=${tenantId}: no addresses to geocode${suffix}.\x1b[0m`,
    );
    process.exit(0);
  }

  console.log(
    `\x1b[36m→ Tenant=${tenantId}, ${targets.length} address(es) to geocode, ${interval}ms between requests\x1b[0m`,
  );

  let ok = 0;
  let failed = 0;

  for (let index = 0; index < targets.length; index++) {
    const id = targets[index];
    const body = {
      model: MODEL,
      action: ACTION,
      data: {context: {id, _model: MODEL}},
    };

    const status = await axios
      .post(endpoint, body, {headers})
      .then(response => response.data?.status)
      .catch(() => undefined);

    if (status === 0) {
      ok++;
    } else {
      failed++;
      console.log(
        `  \x1b[33m∅ fail\x1b[0m address id=${id} (status=${status})`,
      );
    }

    if ((index + 1) % 25 === 0 || index + 1 === targets.length) {
      console.log(`  …${index + 1}/${targets.length}  ok=${ok} fail=${failed}`);
    }

    if (index + 1 < targets.length) await sleep(interval);
  }

  /* Coverage is recomputed from the database: a successful action call does not
   * guarantee a match, so this reflects how many addresses actually have
   * coordinates now. */
  const total = Number(await client.aOSAddress.count({}));
  const stillMissing = Number(
    await client.aOSAddress.count({
      where: {OR: [{latit: null}, {longit: null}]},
    }),
  );

  console.log(
    `\x1b[32m✓ Done. processed=${targets.length} ok=${ok} fail=${failed} | coverage ${total - stillMissing}/${total} (still missing ${stillMissing})\x1b[0m`,
  );
  process.exit(0);
}

main().catch(error =>
  fail(error instanceof Error ? error.message : String(error)),
);
