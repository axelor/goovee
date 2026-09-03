import {getBasePath} from '@/lib/core/path/base-path';

/*
 * The root an absolute address stands on, and the two directions between such an
 * address and a `workspaceURI`. Those two are each other's inverse, so they sit
 * together: a change to what the root is made of has to land on both or stored
 * addresses stop round-tripping.
 *
 * Config-free on purpose, so the client half of the address builders can use
 * them. The origin a root is built on is passed in rather than read, and comes
 * from wherever its caller holds one — a tenant's own host, read from the
 * tenant's configuration on the server and from `useEnvironment()` in the
 * browser, or the deployment's auth origin, which `$global` holds.
 */

/**
 * An absolute root the app is served from: an origin — scheme and host, no
 * trailing slash — joined to the deployment base path, giving
 * `https://example.com/portal`, or just `https://example.com` where no base
 * path is configured.
 *
 * Whose origin is up to the caller and makes no difference here. A tenant's own
 * origin gives the root its workspaces are stored against, so that is the prefix
 * to put in front of a `workspaceURI` or to strip off a stored value; the
 * deployment's auth origin gives the root that answers the addresses naming no
 * tenant.
 *
 * `host` is stated either way rather than defaulted, because `undefined` carries
 * two readings and a caller means one of them. A tenant the configuration
 * document does not name has no host, and the root that results matches no
 * stored workspace, so a lookup built on one denies access rather than granting
 * it. A caller passing `undefined` deliberately is instead asking for the
 * deployment base path on its own — all of the root that is left once the host
 * an address was written under is out of the picture.
 */
export function absoluteRoot(host: string | undefined): string {
  return `${host ?? ''}${getBasePath()}`;
}

/**
 * A stored absolute `workspace.url` as the `workspaceURI` a browser holds for
 * it, by taking off the root the app is served from.
 *
 * What is left is `/{tenant}/{workspace}` for a tenant sharing its origin and
 * `/{workspace}` for one reached by host — the tenant is named by the host
 * there, so its stored URL carries no tenant segment. Which of the two a value
 * was written as follows from the tenant's own configuration; this only strips.
 *
 * A URL that does not sit under this root comes back unchanged, and `/` stands
 * in for an empty result.
 */
export function toWorkspaceURI(
  workspaceURL: string,
  host: string | undefined,
): string {
  const root = absoluteRoot(host);

  /* Only a leading root followed by a path boundary is removed. An unanchored
   * replace would also cut the root out of the middle of a URL that happens to
   * carry it — in a query parameter, say — and without the boundary a URL under
   * an origin the root is merely a string prefix of (`…example.com.br`,
   * `…example.com:8443`) would be sliced mid-host. Either way the contract is
   * the same: a URL not under this root comes back unchanged. */
  if (!root || !workspaceURL.startsWith(root)) {
    return workspaceURL || '/';
  }

  const rest = workspaceURL.slice(root.length);

  if (rest && !rest.startsWith('/')) {
    return workspaceURL;
  }

  return rest || '/';
}
