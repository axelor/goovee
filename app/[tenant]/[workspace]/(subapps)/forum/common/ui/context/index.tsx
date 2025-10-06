'use client';

import React, {useContext} from 'react';
import {ForumGroup, Group} from '../../types/forum';
import {PortalWorkspace, User} from '@/types';

type ForumContextType = {
  memberGroups: ForumGroup[];
  nonMemberGroups: ForumGroup[];
  selectedGroup: ForumGroup | null;
  user: User | null;
  workspace: PortalWorkspace | null;
};
const INITIAL_STATE: ForumContextType = {
  memberGroups: [],
  nonMemberGroups: [],
  selectedGroup: null,
  user: null,
  workspace: null,
};
export const ForumContext =
  React.createContext<ForumContextType>(INITIAL_STATE);

export default function ForumContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ForumContextType;
}) {
  return (
    <ForumContext.Provider value={value}>{children}</ForumContext.Provider>
  );
}

export function useForum() {
  return useContext(ForumContext);
}
