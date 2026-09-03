/*
 * What identifies one mail account, and how many connections it allows.
 *
 * Kept apart from the transport it configures because two things must agree on
 * it: the pool is keyed on the identity, and the configuration is refused at
 * load when tenants sharing that identity disagree on the ceiling. Defining
 * either twice would let a field added to the key alone split pools that the
 * validation still treats as one.
 *
 * Nothing here reads configuration or opens a connection, so it can be used
 * before any tenant is connected.
 */

import type {TenantConfig} from '@/tenant';

/** The mail settings of a tenant that declares them. */
export type MailSettings = NonNullable<TenantConfig['mail']>;

/* Servers differ by an order of magnitude — a Microsoft 365 mailbox allows three
 * and refuses the rest with `432 4.3.2 Concurrent connections limit exceeded`. */
const DEFAULT_MAX_CONNECTIONS = 10;

/**
 * The account a set of mail settings sends as.
 *
 * The password is deliberately not part of it: it is marked as a server secret
 * at configuration load, and host, port and user already name the account. A
 * rotated credential therefore needs a restart to take effect.
 */
export function mailAccountKey(mail: MailSettings): string {
  return [mail.host, mail.port, Boolean(mail.secure), mail.user].join('|');
}

/** The ceiling actually applied, which is what two tenants have to agree on. */
export function getMaxConnections(mail: MailSettings): number {
  return mail.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
}
