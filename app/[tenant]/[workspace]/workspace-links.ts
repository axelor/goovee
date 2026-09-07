/**
 * A workspace as the shell's switchers need it: what to show, and where to go.
 *
 * `href` is built on the server, in app/[tenant]/[workspace]/layout.tsx, because
 * only the configuration knows how each tenant is routed. The stored `url` — the
 * key AOS identifies a workspace by — stays on the server, so a page hands out
 * addresses without handing out identities.
 */
export type WorkspaceLink = {
  id: string;
  name: string | null;
  href: string;
};
