/* Loads the `.env` files the server would: the production ones where
 * NODE_ENV=production is set, as it is on a server, and the development ones on
 * a checkout. First, because the loader below reads the environment as it is
 * evaluated. */
import '@/load-swc-env';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';
/* Safe to import here, unlike the configuration loader: these modules read
 * nothing, so importing them cannot settle what the configuration holds. */
import {isFileSource} from '@/config/document';
import {isHostRouted} from '@/lib/core/tenant/routing';
/* Reaches `getBasePath`, whose module reads NEXT_PUBLIC_BASE_PATH as it is
 * evaluated, which the import above of `@/load-swc-env` has already filled in. */
import {absoluteRoot} from '@/lib/core/url/absolute';

/*
 * Answers the question a deployment otherwise answers by starting: is this
 * environment one the application will accept?
 *
 * The variables are read and validated by the application's own loader, reached
 * through a dynamic import below, so this cannot reach a different verdict than
 * start-up does. Checks written out again here would be free to drift, and the
 * drift would surface as a configuration this accepts and the server refuses.
 *
 * Only the configuration is examined. Nothing is connected to, so a database, an
 * AOS instance or a mail host that cannot be reached is not a fault here.
 */
runScript<{sources?: boolean}>({
  command: 'pnpm config:check',
  title: 'Validate the configuration',
  summary: `Reads the configuration the application would read — the PORTAL_*
variables from the process environment and the .env files the server loads,
then the portal.config*.json files in the working directory — and validates it
the way start-up does, naming every fault against the variable or file entry
holding it. Reports the tenants a valid configuration declares and the address
each is reached at. Ends non-zero for a configuration that would be refused, so
a deployment can be gated on it rather than on a server that starts and then
fails every request. Nothing is connected to: an unreachable database, AOS
instance or mail host is not a fault here.`,
  options: command =>
    command.option(
      '--sources',
      'List every setting read, with the variable or file it came from',
    ),
  run: async ({values}) => {
    const provider = await import('@/tenant/config');

    const loaded = (() => {
      try {
        /* Either accessor loads the whole configuration, so this raises exactly
         * what start-up raises: no configuration, a variable or file entry
         * naming no setting, or a shape and a set of invariants spanning tenants
         * that the load refuses. */
        return {
          tenants: provider.listTenantConfigs(),
          deployment: provider.getDeploymentConfig(),
          sources: provider.listConfigSources(),
        };
      } catch (error) {
        /* A refused configuration arrives worded by the loader, against the
         * variables and file entries at fault. Reported as this script's own failure, so it comes
         * without a stack, which would say only that a schema rejected
         * something. */
        out.fail(error instanceof Error ? error.message : String(error));
      }
    })();

    const {tenants, deployment, sources} = loaded;

    /* Which files took part, by name: an operator checking a layered
     * configuration is checking that the right file was picked up. */
    const variables = sources.filter(
      ([, source]) => !isFileSource(source),
    ).length;
    const files = [
      ...new Set(sources.map(([, source]) => source).filter(isFileSource)),
    ];

    out.ok(
      `Accepted — ${sources.length} ${sources.length === 1 ? 'setting' : 'settings'} ` +
        `(${variables} from ${variables === 1 ? 'a variable' : 'variables'}` +
        `${files.length ? `, ${sources.length - variables} from ${files.join(', ')}` : ''}), ` +
        `${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'}. ` +
        `Addresses naming none are served on ${absoluteRoot(deployment.origin)}.`,
    );

    /* The address, not just the origin, because a tenant routed by host is
     * reached without its id and an operator reading this is checking the
     * addresses their proxy has to serve. The base path comes from its own
     * variable, so this is the address as served by a deployment carrying the
     * NEXT_PUBLIC_BASE_PATH this script was run with. */
    for (const [id, config] of tenants) {
      const root = absoluteRoot(config.public.host);
      const hostRouted = isHostRouted(config);
      const isDefault = id === deployment.defaultTenant;

      console.log(
        `  ${id} → ${hostRouted ? root : `${root}/${id}`}` +
          `${isDefault ? ' (default)' : ''}` +
          `${hostRouted ? ' [routed by host]' : ''}`,
      );
    }

    /* Names only: the values are the secrets, and the point of this listing is
     * to see which variables took effect, not what they hold. */
    if (values.sources) {
      console.log('');
      for (const [setting, variable] of sources.sort()) {
        console.log(`  ${setting}  ←  ${variable}`);
      }
    }
  },
});
