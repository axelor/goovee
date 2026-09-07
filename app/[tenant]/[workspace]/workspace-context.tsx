'use client';

import React, {useContext, useEffect, useMemo, useRef} from 'react';
import {DEFAULT_WORKSPACE} from '@/constants';

// ---- CORE IMPORTS ---- //
import {useTheme} from '@/app/theme';
import {Theme} from '@/types/theme';
import {type Workspace} from '@/orm/workspace';
import {useEnvironment} from '@/environment';
import {useTenantScope} from '@/lib/core/url/tenant-context';
import {buildTenantScope, type TenantScope} from '@/lib/core/url/tenant-urls';
import {
  buildWorkspaceScope,
  type WorkspaceScope,
} from '@/lib/core/url/workspace-urls';

export const WorkspaceContext = React.createContext<{
  tenant: string;
  workspace: string;
  /**
   * The workspace's stored `url`: a database key, never an address.
   *
   * Carried for the callers that need the value itself — a key in the browser's
   * own store, whose spelling orphans every record saved under the old one, and
   * a capability-token path that names the workspace the token was minted for.
   * Anything that links somewhere takes `scope`.
   */
  workspaceURL: string;
  workspaceID: Workspace['id'];
  /** Every address below this workspace, measured from the prefix the server resolved. */
  scope: WorkspaceScope;
  /**
   * Every address below the tenant — the route handlers, and the screens that
   * sit beside this workspace rather than under it. Carried here so a component
   * that already holds the workspace does not reach for a second hook.
   */
  tenantScope: TenantScope;
}>({
  tenant: '',
  workspace: DEFAULT_WORKSPACE,
  workspaceURL: '',
  workspaceID: '',
  scope: buildWorkspaceScope({
    tenantId: '',
    workspace: DEFAULT_WORKSPACE,
    visitorPrefix: '',
    host: undefined,
  }),
  tenantScope: buildTenantScope({
    tenantId: '',
    visitorPrefix: '',
    host: undefined,
  }),
});

/**
 * Binds one workspace's addresses to everything below it.
 *
 * @param workspaceURI - the visitor prefix, given rather than built from the
 *   tenant and workspace names: its shape depends on how the tenant is routed,
 *   which is server-side configuration, and the workspace shell resolves it from
 *   the access gate. It reaches the rest of the app only through `scope` —
 *   nothing reads the prefix itself.
 */
export function WorkspaceProvider({
  id,
  tenant,
  workspace,
  workspaceURI,
  theme,
  children,
}: {
  id: Workspace['id'];
  tenant: string;
  workspace: string;
  workspaceURI: string;
  theme?: {id: string; name: string; options: Theme};
  children: React.ReactNode;
}) {
  const {updateTheme} = useTheme();
  const prevTheme = useRef<any>(undefined);
  const env = useEnvironment();
  const tenantScope = useTenantScope();

  const workspaceID = id;

  /* Built from the prefix the server resolved, so the client never has to know
   * how its tenant is routed. `forExternal()` with no sub-path is the stored
   * workspace URL, which is why `workspaceURL` is read off it rather than
   * joined a second way. */
  const scope = useMemo(
    () =>
      buildWorkspaceScope({
        tenantId: tenant,
        workspace,
        visitorPrefix: workspaceURI,
        host: env.host,
      }),
    [tenant, workspace, workspaceURI, env.host],
  );

  const value = useMemo(
    () => ({
      tenant,
      workspace,
      workspaceURL: scope.forExternal(),
      workspaceID,
      scope,
      tenantScope,
    }),
    [tenant, workspace, workspaceID, scope, tenantScope],
  );

  useEffect(() => {
    if (theme && theme.options && theme.id !== prevTheme.current) {
      updateTheme(theme?.options);
      prevTheme.current = theme.id;
    }
  }, [theme, updateTheme]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export default WorkspaceProvider;
