/**
 * Collision-proof storage key for a per-app cart. Every cart in the workspace
 * lives under its own `cart:<appCode>:<workspaceURL>` namespace, so no two apps
 * can ever stomp each other's storage. Apps that scope their cart to the
 * logged-in user pass a `userId`; apps that keep a single workspace-wide cart
 * omit it.
 */
export function cartStorageKey(
  code: string,
  workspaceURL: string,
  userId?: string,
): string {
  return `${userId ? `${userId}:` : ''}cart:${code}:${workspaceURL}`;
}

/**
 * Per-app contribution to the shared cart machinery. The generic store/provider
 * can't type or count a cart's contents (only the owning app knows its shape),
 * so each app supplies these.
 */
export type CartSummary = {
  code: string;
  label: () => string;
  href: (workspaceURI: string) => string;
  storageKey: (workspaceURL: string, userId?: string) => string;
  /* Returns the badge count from the opaque stored blob. */
  getCount: (stored: unknown) => number;
  /* Optional one-time lifecycle the provider runs when it first loads this
   * cart (e.g. guest→user merge, legacy-key migration). Receives the value
   * read from the cart's active key and returns the value to use. */
  init?: (
    raw: unknown,
    ctx: {workspaceURL: string; userId?: string},
  ) => Promise<unknown> | unknown;
};
