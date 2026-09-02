'use client';

import React, {useContext, useEffect, useMemo, useRef} from 'react';
import {DEFAULT_WORKSPACE} from '@/constants';

// ---- CORE IMPORTS ---- //
import {useTheme} from '@/app/theme';
import {Theme} from '@/types/theme';
import {type Workspace} from '@/orm/workspace';
import {useEnvironment} from '@/environment';
import {getPortalRoot} from '@/utils/workspace-url';

export const WorkspaceContext = React.createContext<{
  tenant: string;
  workspace: string;
  workspaceURI: string;
  workspaceURL: string;
  workspaceID: Workspace['id'];
}>({
  tenant: '',
  workspace: DEFAULT_WORKSPACE,
  workspaceURI: '',
  workspaceURL: '',
  workspaceID: '',
});

/* `workspaceURI` is given rather than built from the tenant and workspace names:
 * its shape depends on how the tenant is routed, which is server-side
 * configuration. `workspacePathname` is where it comes from. */
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

  const workspaceURL = `${getPortalRoot(env.GOOVEE_PUBLIC_HOST)}${workspaceURI}`;
  const workspaceID = id;

  const value = useMemo(
    () => ({tenant, workspace, workspaceURI, workspaceURL, workspaceID}),
    [tenant, workspace, workspaceURI, workspaceURL, workspaceID],
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
