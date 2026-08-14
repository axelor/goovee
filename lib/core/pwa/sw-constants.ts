// This file is imported by the service worker (sw.ts) and bundled into it.
// Only add plain literals here — no imports, no function calls, no side effects.
const PUSH_CHANNEL = 'push-notifications';

/**
 * The channel a tenant's notifications are announced on.
 *
 * A BroadcastChannel reaches every page on the origin, and per-tenant worker
 * scopes do not partition it, so one name would carry a notification into a
 * different tenant's open tab — where it would be listed, and where marking it
 * read by tag would clear an unrelated record that happens to share an id.
 * Naming the channel after the tenant keeps each one's traffic to itself.
 *
 * Both ends derive the name from this, so leading and trailing slashes are
 * stripped: the worker has a path segment (`/acme`) and the client a bare id.
 */
export function pushChannelName(tenant: string): string {
  return `${PUSH_CHANNEL}/${tenant.replace(/^\/+|\/+$/g, '')}`;
}

export const MSG_TYPE = {
  NEW: 'NEW_NOTIFICATION',
  READ: 'MARK_READ',
  CLOSE: 'CLOSE_NOTIFICATION',
  CLOSE_ALL: 'CLOSE_ALL_NOTIFICATIONS',
} as const;
