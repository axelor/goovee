/* Loads `.env.local`, `.env.production` and `.env`, so that running this with no
 * argument against a deployment reads the document that deployment would. A
 * development-mode file is not among them, so a checkout served by `pnpm dev`
 * needs the path passed. First, because the loader below takes the path it reads
 * from the environment. */
import '@/load-swc-env';

import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
/* Safe to import here, unlike the document's loader: this module reads nothing,
 * so importing it cannot settle where the document is read from. */
import {isHostRouted} from '@/lib/core/tenant/routing';
/* Reaches `getBasePath`, whose module reads NEXT_PUBLIC_BASE_PATH as it is
 * evaluated, which the import above of `@/load-swc-env` has already filled in. */
import {absoluteRoot} from '@/lib/core/url/absolute';

/*
 * Answers the question a deployment otherwise answers by starting: is this
 * configuration document one the application will accept?
 *
 * The document is read and validated by the application's own loader, reached
 * through a dynamic import below, so this cannot reach a different verdict than
 * start-up does. Checks written out again here would be free to drift, and the
 * drift would surface as a document this accepts and the server refuses.
 *
 * Only the document is examined. Nothing is connected to, so a database, an AOS
 * instance or a mail host that cannot be reached is not a fault here.
 */
runScript<object, [string | null]>({
  command: 'pnpm config:check',
  title: 'Validate the tenant configuration document',
  summary: `Reads the document the application would read — the path given here,
or TENANTS_CONFIG_FILE, or TENANTS_CONFIG — and validates it the way start-up
does, naming every fault against the tenant and the field holding it. Reports
the tenants a valid document declares and the address each is reached at. Ends
non-zero for a document that would be refused, so a deployment can be gated on
it rather than on a server that starts and then fails every request. Nothing is
connected to: an unreachable database, AOS instance or mail host is not a fault
here.`,
  options: command =>
    command.argument(
      '[path]',
      'Document to validate, instead of the one the environment names',
    ),
  run: async ({args}) => {
    const [given] = args;

    /* Set before the loader is imported, because where the document is comes
     * from the environment as that module is evaluated rather than on each
     * access. A path set here wins over inline JSON on its own: the loader reads
     * the file whenever it has one. */
    if (given) {
      process.env.TENANTS_CONFIG_FILE = path.resolve(process.cwd(), given);
    }

    out.note(
      process.env.TENANTS_CONFIG_FILE
        ? `Reading ${process.env.TENANTS_CONFIG_FILE}`
        : 'Reading TENANTS_CONFIG',
    );

    const provider = await import('@/tenant/config');

    const loaded = (() => {
      try {
        /* Either accessor loads the whole document, so this raises exactly what
         * start-up raises: no document, unreadable JSON, or a shape and a set of
         * invariants spanning tenants that the load refuses. */
        return {
          tenants: provider.listTenantConfigs(),
          deployment: provider.getGlobalConfig(),
        };
      } catch (error) {
        /* A rejected document arrives worded by the loader, against the fields at
         * fault; a document it could not read at all — no such file — arrives as
         * whatever `fs` threw, naming the path. Reported as this script's own
         * failure either way, so it comes without a stack, which would say only
         * that a schema rejected something. */
        out.fail(error instanceof Error ? error.message : String(error));
      }
    })();

    const {tenants, deployment} = loaded;

    out.ok(
      `Accepted — ${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'}. ` +
        `Addresses naming none are served on ` +
        `${absoluteRoot(deployment.betterAuthUrl)}.`,
    );

    /* The address, not just the origin, because a tenant routed by host is
     * reached without its id and an operator reading this is checking the
     * addresses their proxy has to serve. The base path comes from the
     * environment rather than the document, so this is the address as served by
     * a deployment carrying the NEXT_PUBLIC_BASE_PATH this script was run with. */
    for (const [id, config] of tenants) {
      const root = absoluteRoot(config.publicEnv.GOOVEE_PUBLIC_HOST);
      const hostRouted = isHostRouted(config);
      const isDefault = id === deployment.defaultTenant;

      console.log(
        `  ${id} → ${hostRouted ? root : `${root}/${id}`}` +
          `${isDefault ? ' (default)' : ''}` +
          `${hostRouted ? ' [routed by host]' : ''}`,
      );
    }
  },
});
