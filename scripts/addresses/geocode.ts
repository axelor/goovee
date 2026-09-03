import '@/load-swc-env';

import type {GooveeClient} from '@/goovee/.generated/client';
import {explainHttpFailure} from '@/scripts/lib/http';
import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {getAOSHeaders} from '@/tenant/auth';
import axios from 'axios';
import {InvalidArgumentError} from 'commander';

/* The AOS per-record action that geocodes an address and writes latit/longit.
 * The geocoding provider (Open Street Map by default, or Google Maps) is set
 * in App Base, so this script does not talk to any map service directly. */
const ACTION = 'action-base-address-method-update-lat-long';
const MODEL = 'com.axelor.apps.base.db.Address';

const PAGE_SIZE = 500;

/* Open Street Map / Nominatim allows about one request per second, so requests
 * are paced by default. Configurable via --interval. */
const DEFAULT_INTERVAL_MS = 1200;

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

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await client.aOSAddress.find({
      ...(onlyMissing ? {where: {OR: [{latit: null}, {longit: null}]}} : {}),
      select: {id: true},
      orderBy: {id: 'ASC'},
      take: PAGE_SIZE,
      skip: offset,
    });

    for (const address of page) ids.push(address.id);

    if (page.length < PAGE_SIZE) break;
    if (max !== undefined && ids.length >= max) break;
  }

  return max !== undefined ? ids.slice(0, max) : ids;
}

/* Parsed while the command line is being read, so a bad value is refused with
 * the usage text before the script runs at all. */
function readMilliseconds(value: string): number {
  const interval = Number(value);

  /* Blank refused rather than read: `Number('')` is 0, which would turn
   * `--interval=` into no pacing at all against the geocoding provider. */
  if (!value.trim() || !Number.isFinite(interval) || interval < 0) {
    throw new InvalidArgumentError(
      'must be a non-negative number of milliseconds.',
    );
  }

  return interval;
}

function readCount(value: string): number {
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new InvalidArgumentError('must be a positive integer.');
  }

  return limit;
}

type Values = {force?: boolean; limit?: number; interval: number};

runTenantScript<Values>({
  command: 'pnpm addresses:geocode',
  title: 'Address geocoder',
  explain: explainHttpFailure,
  summary: `Generates latitude and longitude for portal addresses by calling the
AOS "${ACTION}" action per record, which geocodes via
the provider configured in App Base (Open Street Map by default, or Google
Maps). By default only addresses missing coordinates are processed.

An address whose location cannot be resolved is left without coordinates, so
the final coverage can be lower than the number of records processed.`,
  options: command =>
    command
      .option(
        '--force',
        'Re-geocode every address, not just those missing coordinates',
      )
      .option('--limit <n>', 'Process at most n addresses', readCount)
      .option(
        '--interval <ms>',
        'Delay between requests in milliseconds',
        readMilliseconds,
        DEFAULT_INTERVAL_MS,
      ),
  run: async ({values, openTenant}) => {
    const {interval, limit} = values;

    const {client, config, tenantId} = await openTenant();

    const aos = config.aos;
    if (!aos?.url) out.fail(`AOS url not configured for tenant '${tenantId}'.`);

    /* getAOSHeaders rather than the auth headers alone: a tenant sharing an AOS
     * instance selects itself with X-Tenant-ID on every request, and without it
     * this would write coordinates onto another tenant's addresses. */
    const headers = {
      ...getAOSHeaders(aos),
      'Content-Type': 'application/json',
    };
    const endpoint = `${aos.url}/ws/action/${ACTION}`;

    const targets = await collectAddressIds(client, !values.force, limit);

    if (targets.length === 0) {
      const suffix = values.force
        ? ''
        : ' (all already have coordinates; use --force to redo)';
      out.note(`Tenant=${tenantId}: no addresses to geocode${suffix}.`);
      return;
    }

    out.note(
      `Tenant=${tenantId}, ${targets.length} address(es) to geocode, ${interval}ms between requests`,
    );

    let succeeded = 0;
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
        .catch(error => {
          /* A back end that never answered will not answer for the next address
           * either, so the run stops instead of pacing out the whole list at
           * one request per interval. An answer that reports no match is a
           * different thing, and is counted below. */
          if (axios.isAxiosError(error) && !error.response) throw error;

          return undefined;
        });

      if (status === 0) {
        succeeded++;
      } else {
        failed++;
        out.warn(`address id=${id} could not be geocoded (status=${status})`);
      }

      if ((index + 1) % 25 === 0 || index + 1 === targets.length) {
        console.log(
          `  …${index + 1}/${targets.length}  ok=${succeeded} fail=${failed}`,
        );
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

    out.ok(
      `Done. processed=${targets.length} ok=${succeeded} fail=${failed} | coverage ${total - stillMissing}/${total} (still missing ${stillMissing})`,
    );
  },
});
