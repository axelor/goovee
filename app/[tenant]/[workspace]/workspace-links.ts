/**
 * A workspace as the shell's switchers need it: what to show, and where to go.
 *
 * `href` is built on the server, in app/[tenant]/[workspace]/layout.tsx, because
 * only the configuration knows how each tenant is routed. The switchers used to
 * receive every workspace's stored `url` — the key AOS identifies it by — and
 * take the deployment root off it in the browser; keeping that key on the server
 * is what lets a page hand out addresses without handing out identities.
 */
export type WorkspaceLink = {
  id: string;
  name: string | null;
  href: string;
};
