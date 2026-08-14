// ---- CORE IMPORTS ---- //
import {listTenantConfigsSync} from '@/tenant/config-provider';
import type {TenantConfig} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {MailNotificationService} from './mail';
import {getMaxConnections, mailAccountKey} from './mail-account';

/**
 * Report at startup whether mail can be delivered — nothing else in the portal
 * surfaces a bad mail configuration. `verify()` opens its own connection and
 * authenticates, then quits it, so it does not consume one of the pool's.
 *
 * Checked once per distinct mail account rather than once per tenant: tenants
 * sharing a mailbox share a pool, so verifying each of them separately would only
 * spend extra authentication round-trips on the same server at every boot. A
 * tenant that declares no mail settings is skipped in silence — the service
 * reports that itself, and it is a legitimate configuration.
 */
export async function checkMailTransport(): Promise<void> {
  /* Reporting must not be what stops the server starting. Reading the document
   * throws when it is missing or malformed, and this is called without being
   * awaited, so an escaping error would surface as an unhandled rejection —
   * which ends the process rather than losing the report. */
  try {
    await report();
  } catch (error) {
    console.error('[MAIL][STARTUP] could not read the configuration:', error);
  }
}

async function report(): Promise<void> {
  const seen = new Set<string>();
  const accounts: Array<[string, TenantConfig]> = [];

  for (const [tenantId, config] of listTenantConfigsSync()) {
    const mail = config.mail;
    if (!mail?.host) continue;

    const key = mailAccountKey(mail);
    if (seen.has(key)) continue;
    seen.add(key);

    accounts.push([tenantId, config]);
  }

  /* Verified together rather than one after another: each unreachable account
   * costs a connection and greeting timeout, so a deployment with several would
   * otherwise take minutes to finish reporting. `verify()` opens its own
   * connection, so they do not contend for the pools. */
  await Promise.all(
    accounts.map(([tenantId, config]) => verifyAccount(tenantId, config)),
  );
}

async function verifyAccount(
  tenantId: string,
  config: TenantConfig,
): Promise<void> {
  const mail = config.mail!;
  const where = `${mail.host}:${mail.port}`;

  try {
    const service = MailNotificationService.create(config);

    /* `create()` says what is missing but cannot say for whom — a TenantConfig
     * carries no id. At startup the id is in hand, and a tenant whose mail is
     * half-configured is exactly the one an operator needs named: it will drop
     * its password resets silently. */
    if (!service) {
      const missing = (['port', 'user', 'password'] as const).filter(
        field => !mail[field],
      );

      console.error(
        `[MAIL][STARTUP] "${tenantId}" declares mail.host ${mail.host} but is missing ` +
          `${missing.map(field => `mail.${field}`).join(', ')} — no mail will be sent for it.`,
      );
      return;
    }

    await service.verify();

    console.log(
      `[MAIL][STARTUP] mail server accepted a connection for "${tenantId}" — ${where} reachable and credentials accepted; ` +
        `pool holds up to ${getMaxConnections(mail)} connections (set mail.maxConnections if the server allows fewer)`,
    );
  } catch (error) {
    console.error(
      `[MAIL][STARTUP] mail server is NOT usable for "${tenantId}" — no mail will arrive for it, including password resets and one-time codes. ` +
        `Check that ${where} is reachable from the server and that its mail.user and mail.password are accepted.`,
      error,
    );
  }
}
