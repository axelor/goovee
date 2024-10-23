'use client';

import React, {useContext, useEffect, useMemo, useRef} from 'react';
import {
  DEFAULT_TENANT,
  DEFAULT_WORKSPACE,
  DEFAULT_WORKSPACE_URI,
  DEFAULT_WORKSPACE_URL,
} from '@/constants';

// ---- CORE IMPORTS ---- //
import {useTheme} from '@/app/theme';
import {Theme} from '@/types/theme';

export const WorkspaceContext = React.createContext<{
  tenant: string;
  workspace: string;
  workspaceURI: string;
  workspaceURL: string;
  workspaceID: string;
}>({
  tenant: DEFAULT_TENANT,
  workspace: DEFAULT_WORKSPACE,
  workspaceURI: DEFAULT_WORKSPACE_URI,
  workspaceURL: DEFAULT_WORKSPACE_URL,
  workspaceID: '',
});

export function Workspace({
  id,
  tenant,
  workspace,
  theme,
  children,
}: {
  id: string;
  tenant: string;
  workspace: string;
  theme?: {id: string; name: string; options: Theme};
  children: React.ReactNode;
}) {
  const {updateTheme} = useTheme();
  const prevTheme = useRef<any>();

  const workspaceURI = `/${tenant}/${workspace}`;
  const workspaceURL = `${process.env.NEXT_PUBLIC_HOST}${workspaceURI}`;
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

export default Workspace;
