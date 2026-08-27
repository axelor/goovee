import {DEFAULT_TENANT} from '@/constants';
import {
  isMultiTenancy,
  manager,
  type TenantClient,
  type TenantConfig,
} from '@/tenant';
import * as out from './output';
import {
  runParsed,
  type CommandSpec,
  type ScriptArgs,
  type ScriptOptions,
} from './script';

/** Every tenant script gets these, so no script declares them. */
export type TenantValues = {tenant?: string};

/** Holds an open tenant, whose connection the runner releases when the run ends. */
export type TenantHandle = {
  tenantId: string;
  client: TenantClient;
  config: TenantConfig;
};

export type TenantScriptContext<
  Values = object,
  Args extends ScriptArgs = [],
> = {
  values: Values & TenantValues;
  args: Args;
  /**
   * Opens the tenant, and hands back the same one to every later caller. A
   * script asks for it where it first needs the database, so whatever it can do
   * on its own — read a seed file, reject a flag, say what it is about to do —
   * happens before a connection exists. The connection is released when the run
   * ends, and a run that never asks for one opens nothing.
   */
  openTenant: () => Promise<TenantHandle>;
};

export type TenantScriptSpec<
  Values = object,
  Args extends ScriptArgs = [],
> = CommandSpec & {
  run: (context: TenantScriptContext<Values, Args>) => Promise<void>;
};

/**
 * Runs a maintenance script that works on a tenant. Adds `--tenant` to the
 * parser every script shares, opens the tenant that was asked for when the
 * script asks for it, and releases the connection afterwards so the process ends
 * as soon as the work is done.
 */
export function runTenantScript<Values = object, Args extends ScriptArgs = []>(
  spec: TenantScriptSpec<Values, Args>,
): void {
  const withTenant: ScriptOptions = command =>
    (spec.options ? spec.options(command) : command).option(
      '--tenant <id>',
      `Tenant id (defaults to '${DEFAULT_TENANT}' when MULTI_TENANCY is not true)`,
    );

  runParsed<Values & TenantValues, Args>(
    {...spec, options: withTenant},
    async ({values, args}) => {
      /* A single-tenant manager serves the configured database whatever id it is
       * handed, so accepting another one would report work against a tenant that
       * was never opened. */
      if (
        !isMultiTenancy &&
        values.tenant &&
        values.tenant !== DEFAULT_TENANT
      ) {
        out.fail(
          `Tenant '${values.tenant}' cannot be selected: this portal serves the single tenant '${DEFAULT_TENANT}'.`,
        );
      }

      const selected =
        values.tenant ?? (isMultiTenancy ? undefined : DEFAULT_TENANT);

      const requireTenant = (): string =>
        selected ??
        out.fail('--tenant is required when MULTI_TENANCY is true.');

      /* `opened` is set only once there is something to release, so a tenant
       * that could not be opened leaves nothing behind to close. `session` is
       * what callers share, so asking twice cannot open twice. */
      let opened: TenantHandle | undefined;
      let session: Promise<TenantHandle> | undefined;

      const openTenant = (): Promise<TenantHandle> => {
        session ??= (async () => {
          const tenantId = requireTenant();
          const tenant = await manager.getTenant(tenantId);

          /* An id naming no tenant resolves to nothing rather than throwing, so
           * that a value from outside cannot be turned into a fault. Here it is
           * the operator's own argument, and saying so beats failing on a
           * connection that was never opened. */
          if (!tenant) {
            out.fail(`Tenant '${tenantId}' is not configured.`);
          }

          opened = {tenantId, client: tenant.client, config: tenant.config};
          return opened;
        })();

        return session;
      };

      try {
        await spec.run({values, args, openTenant});
      } finally {
        /* An open still in flight has nothing to release yet, so wait for it
         * to settle: a script that asked for the tenant without waiting for it
         * would otherwise leave a connection behind. How it settled is the
         * run's business, not the release's. */
        await session?.catch(() => undefined);

        /* An idle connection keeps the process alive until the pool times it out,
         * which reads as the script hanging after it has reported its result.
         * Releasing it must not replace the failure that brought us here. */
        if (opened) {
          try {
            await opened.client.$disconnect();
          } catch (error) {
            out.warn(
              `Releasing the database connection failed: ${out.describeFailure(error)}`,
            );
          }
        }
      }
    },
  );
}
