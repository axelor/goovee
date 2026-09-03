'use client';

import React, {useContext, useEffect, useMemo, useRef} from 'react';
import {DEFAULT_WORKSPACE} from '@/constants';

// ---- CORE IMPORTS ---- //
import {useTheme} from '@/app/theme';
import {Theme} from '@/types/theme';
import {type Workspace} from '@/orm/workspace';
import {useEnvironment} from '@/environment';
import {
  workspaceURLsFrom,
  type WorkspaceScope,
} from '@/lib/core/url/workspace-urls';

export const WorkspaceContext = React.createContext<{
  tenant: string;
  workspace: string;
  /**
   * The workspace's stored `url`, for the two consumers that need the value
   * itself rather than an address: the cart's storage key, and the invoice
   * payment actions, whose capability-token path names the workspace the token
   * was minted for. It is a database key — to link somewhere, use `url`.
   */
  workspaceURL: string;
  workspaceID: Workspace['id'];
  /** Every address below this workspace. Reach for this, not the strings. */
  scope: WorkspaceScope;
}>({
  tenant: '',
  workspace: DEFAULT_WORKSPACE,
  workspaceURL: '',
  workspaceID: '',
  scope: workspaceURLsFrom({
    tenantId: '',
    workspace: DEFAULT_WORKSPACE,
    visitorPrefix: '',
    host: undefined,
  }),
});

/* The visitor prefix is given rather than built from the tenant and workspace
 * names: its shape depends on how the tenant is routed, which is server-side
 * configuration. The workspace shell resolves it from the access gate. It
 * reaches the rest of the app only through `url` — nothing reads the prefix
 * itself. */
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

  const workspaceID = id;

  /* Built from the prefix the server resolved, so the client never has to know
   * how its tenant is routed. `forExternal()` with no sub-path is the stored
   * workspace URL, which is why `workspaceURL` is read off it rather than
   * joined a second way. */
  const scope = useMemo(
    () =>
      workspaceURLsFrom({
        tenantId: tenant,
        workspace,
        visitorPrefix: workspaceURI,
        host: env.GOOVEE_PUBLIC_HOST,
      }),
    [tenant, workspace, workspaceURI, env.GOOVEE_PUBLIC_HOST],
  );

  const value = useMemo(
    () => ({
      tenant,
      workspace,
      workspaceURL: scope.forExternal(),
      workspaceID,
      scope,
    }),
    [tenant, workspace, workspaceID, scope],
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
