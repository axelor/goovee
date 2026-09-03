import 'server-only';

import {getPublicEnvironment} from '@/environment/utils';
import {withBasePath} from '@/lib/core/path/base-path';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {getTenantConfig} from '@/tenant/config';
import {getPortalRoot} from '@/utils/workspace-url';

import type {WorkspaceSubPath} from './index';
import {revalidateRoutePath} from './revalidate';
import {tenantEntryPath, workspaceVisitorPathSchema} from './server';
import {workspaceURLsFrom, type WorkspaceURLs} from './workspace-urls';

/*
 * Two scopes, because the application has two: some addresses belong to a
 * workspace and some belong only to the tenant. Which one you hold decides what
 * a path argument means, so no method takes a flag saying how deep it is —
 * `tenantURLs(id)` takes paths from the deployment root, and
 * `tenantURLs(id).workspace(slug)` takes paths below that workspace.
 */

/**
 * A path from the deployment root, starting with a slash: `/auth/login`,
 * `/api/tenant/acme/partner/image/3`, `/sw.js`.
 *
 * Distinct from `WorkspaceSubPath` only in what it is measured from; the
 * separate name is what keeps the two from being passed to each other.
 */
export type RootPath = `/${string}`;

/**
 * A workspace's addresses, plus the forms that are not addresses.
 *
 * `routePath` and `key` name a workspace without being somewhere to send a
 * browser — a coordinate the route tree resolves, and a row's primary key. They
 * sit on this type rather than the shared one by intent rather than
 * capability: a browser could compute either from what it already holds, and
 * nothing running in one should act on them.
 */
export type ServerWorkspaceURLs = WorkspaceURLs & {
  /**
   * The coordinate the route tree resolves: `/{tenant}/{workspace}{sub}`,
   * always carrying the tenant segment because the proxy puts it back on a
   * host-routed address before a route is reached.
   *
   * This is what a cache tag matches and what a stored row holds, and the two
   * uses meet: a notification stored at this path, rendered for a visitor,
   * followed from the tray and routed by the proxy arrives back at this exact
   * string.
   */
  routePath(sub?: WorkspaceSubPath): string;

  /**
   * The workspace's stored `url`, which AOS uses as its identity.
   *
   * An address by spelling only — it must be reproduced character for
   * character to find the row, and is never somewhere to send a browser.
   */
  key(): string;

  /**
   * An absolute address built from a path the browser sent, refusing anything
   * that does not sit inside this workspace.
   *
   * Guarantees confinement only: it proves the path names this workspace, not
   * that the sender may reach it. Whoever calls this has already established
   * that separately — a session through the access gate, or a capability token
   * fused with the record it was minted for.
   *
   * @throws when `path` is outside the workspace, or carries a scheme, a
   *   query, a fragment, a backslash or a dot-segment.
   */
  fromClient(path: string, query?: Record<string, string>): string;

  /**
   * Invalidates the cached page at `sub`, or the workspace's own page with no
   * sub-path. Pass `'layout'` to take everything below it instead — one path is
   * all a page invalidation reaches.
   */
  revalidate(sub?: WorkspaceSubPath, type?: 'page' | 'layout'): void;
};

/**
 * A tenant's addresses: the ones that name no workspace, and the way down to
 * one that does.
 *
 * There is deliberately no `forRouter` here. A root path needs nothing added
 * for the router — `/auth/login` is already what `redirect` wants — so a method
 * returning its own argument would only invite the question of whether it does
 * something.
 */
export type TenantURLs = {
  readonly tenantId: string;

  /**
   * A root path as an absolute address on this tenant's own origin — the
   * password-reset and invitation links, whose screens sit outside every tenant
   * segment but are served per tenant.
   */
  forExternal(path: RootPath): string;

  /**
   * Where this tenant's app enters on the origin the request arrived at: the
   * origin root where the tenant holds that origin, its path segment anywhere
   * else, with a trailing slash and the base path in front.
   *
   * The trailing slash is required: this is both the service worker's scope and
   * the manifest's `scope`/`start_url`/`id`, scopes are matched by path prefix,
   * and `/acme` does not enclose `/acme/…`. A browser installs an app only
   * where the page's worker encloses the manifest's scope, so a drift between
   * the two shows up as the install prompt silently not appearing.
   */
  entry(headers: Headers): string;

  /** Where the browser fetches this tenant's manifest, on any origin. */
  manifest(): string;

  /**
   * The addresses of one of this tenant's workspaces.
   *
   * @throws when `slug` could compose a key naming another workspace — see
   *   `assertSlug`.
   */
  workspace(slug: string): ServerWorkspaceURLs;

  /**
   * The same, for a caller holding a workspace's stored `url` rather than its
   * slug — a row that references a workspace, such as an invoice.
   *
   * The slug is the last segment of that value whatever host or base path
   * precedes it, so this reads the slug rather than trusting the rest: a row
   * written before the tenant's address changed still names the right
   * workspace, and every address built from it is the one the tenant is
   * reached at now.
   *
   * @throws when the value ends in no usable segment.
   */
  workspaceByKey(storedURL: string): ServerWorkspaceURLs;
};

/**
 * The slug in a workspace's stored `url`: its last path segment, whatever host
 * and base path precede it.
 */
function workspaceSlugOf(storedURL: string): string {
  const [withoutQuery] = storedURL.split('?');

  return withoutQuery.split('/').filter(Boolean).pop() ?? '';
}

/* A workspace slug is interpolated into a lookup key that AOS compares by exact
 * string match, so a slug carrying a path separator would compose the key of a
 * different workspace — one that may exist and that the visitor may even be
 * granted. Refused rather than escaped, because there is no spelling of these
 * characters that a path segment legitimately needs, and refusing names the
 * fault at the boundary instead of letting a wrong record be found.
 *
 * A slug arrives decoded, so `%` is refused as well: a value still carrying an
 * escape has been decoded one time fewer than this expects, and `%2f` would
 * otherwise slip a separator past the check. `workspaceSlugOf` is the one
 * exception and does not decode — it reads the slug back out of a stored key
 * that `key()` has to reproduce character for character, so the spelling it
 * finds is the spelling that must go back. */
const UNSAFE_SLUG = /[/\\%?#]|^\.{1,2}$/;

/**
 * Whether `slug` names a workspace without being able to compose the key of a
 * different one.
 *
 * For a caller that holds a slug it did not choose — one read out of the
 * address a request arrived at — where a refusal is an ordinary
 * workspace-not-found rather than a fault. A caller naming a workspace from
 * configuration or from a row should go straight to `workspace()`, whose throw
 * is the right answer there.
 */
export function isUsableSlug(slug: string): boolean {
  return Boolean(slug) && !UNSAFE_SLUG.test(slug);
}

function assertSlug(slug: string): string {
  if (!isUsableSlug(slug)) {
    throw new Error(`Invalid workspace slug: ${JSON.stringify(slug)}`);
  }

  return slug;
}

/**
 * The addresses of a tenant, read from its configuration.
 *
 * Config only: it knows the tenant's host, the deployment's base path and how
 * the tenant is routed, and nothing about the request, the session or what the
 * visitor may reach. That is what lets a webhook route, a script or a cron job
 * build the same addresses an action builds — none of them has a session, and
 * the ones outside the proxy matcher have no tenant header either.
 *
 * A tenant the document does not name yields addresses with no host, which
 * match no stored workspace, so a lookup built on them denies access rather
 * than granting it.
 */
export function tenantURLs(tenantId: string): TenantURLs {
  const config = getTenantConfig(tenantId);
  const host = getPublicEnvironment(config).GOOVEE_PUBLIC_HOST;
  const hostRouted = Boolean(config && isHostRouted(config));

  const workspaceURLs = (slug: string): ServerWorkspaceURLs => {
    const workspace = assertSlug(slug);

    /* The tenant segment is absent from a host-routed tenant's addresses,
     * where the host names it instead. Everything a caller asks for is
     * measured from this. */
    const visitorPrefix = hostRouted
      ? `/${workspace}`
      : `/${tenantId}/${workspace}`;

    const base = workspaceURLsFrom({
      tenantId,
      workspace,
      visitorPrefix,
      host,
    });

    const routePath = (sub: WorkspaceSubPath = '/') =>
      sub === '/'
        ? `/${tenantId}/${workspace}`
        : `/${tenantId}/${workspace}${sub}`;

    return {
      ...base,
      routePath,
      key: () => `${getPortalRoot(host)}${visitorPrefix}`,
      fromClient: (path, query) => {
        workspaceVisitorPathSchema(visitorPrefix).parse(path);

        const url = `${getPortalRoot(host)}${path}`;

        return query ? `${url}?${new URLSearchParams(query)}` : url;
      },
      revalidate: (sub, type) => revalidateRoutePath(routePath(sub), type),
    };
  };

  return {
    tenantId,

    forExternal: path => `${getPortalRoot(host)}${path}`,

    entry: headers => tenantEntryPath(tenantId, headers),

    manifest: () => withBasePath(`/${tenantId}/manifest.webmanifest`),

    workspace: workspaceURLs,

    workspaceByKey: storedURL => workspaceURLs(workspaceSlugOf(storedURL)),
  };
}
