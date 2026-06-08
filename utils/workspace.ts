import {getBasePath} from '@/lib/core/path/base-path';

/**
 * Absolute root the app is served from: the public host joined with the
 * deployment base path, without a trailing slash
 * (e.g. `https://example.com/portal`, or just `https://example.com`).
 *
 * Workspace URLs are stored in this form, so this is the prefix to strip from
 * (or prepend to) a stored `workspace.url`.
 */
export function getPortalRoot(host?: string) {
  return `${host ?? ''}${getBasePath()}`;
}

/**
 * Converts a stored absolute `workspace.url`
 * (`{host}{basePath}/{tenant}/{workspace}`) into a router-relative path
 * (`/{tenant}/{workspace}`).
 */
export function toWorkspaceURI(workspaceURL: string, host?: string) {
  return workspaceURL.replace(getPortalRoot(host), '') || '/';
}

export function workspacePathname(params: {
  tenant: string;
  workspace: string;
}): {
  tenant: string;
  workspace: string;
  workspaceURI: string;
  workspaceURL: string;
} {
  const {tenant, workspace} = params;

  const workspaceURI = `/${tenant}/${workspace}`;
  const workspaceURL = `${getPortalRoot(process.env.GOOVEE_PUBLIC_HOST)}${workspaceURI}`;

  return {
    tenant,
    workspace,
    workspaceURI,
    workspaceURL,
  };
}
