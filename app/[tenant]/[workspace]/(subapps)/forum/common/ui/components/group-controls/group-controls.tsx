'use client';
import {useMemo, useOptimistic, useRef, useState, useTransition} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {User} from '@/types';
import {Skeleton} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {ForumGroup} from '@/subapps/forum/common/types/forum';
import {
  GroupActionList,
  Search as GroupSearch,
} from '@/subapps/forum/common/ui/components';
import {GROUPS, MEMBER, OTHER_GROUPS} from '@/subapps/forum/common/constants';
import {
  exitGroup,
  joinGroup,
  pinGroup,
} from '@/subapps/forum/common/action/action';

export function GroupControls({
  memberGroups,
  nonMemberGroups,
  user,
  selectedGroup,
}: {
  memberGroups: ForumGroup[];
  nonMemberGroups: ForumGroup[];
  user: User | null;
  selectedGroup: ForumGroup | null;
}) {
  const userId = user?.id as string;
  const isLoggedIn = !!user?.id;
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const [, startTransition] = useTransition();
  const [groupSearchValue, setGroupSearchKey] = useState<string>('');

  // Ref-based guard prevents double-clicks without any re-render that
  // could interfere with the RSC transition.
  const pendingRef = useRef(new Set<string>());

  const [optimisticMemberGroups, dispatchMemberGroup] = useOptimistic(
    memberGroups,
    (
      state: ForumGroup[],
      action:
        | {type: 'remove'; groupId: string}
        | {type: 'toggle-pin'; groupId: string},
    ) => {
      if (action.type === 'remove') {
        return state.filter((g: any) => g.forumGroup.id !== action.groupId);
      }
      if (action.type === 'toggle-pin') {
        return state.map((g: any) =>
          g.forumGroup.id === action.groupId ? {...g, isPin: !g.isPin} : g,
        );
      }
      return state;
    },
  );

  const [optimisticNonMemberGroups, dispatchNonMemberGroup] = useOptimistic(
    nonMemberGroups,
    (state: any[], action: {type: 'remove'; groupId: string}) => {
      if (action.type === 'remove') {
        return state.filter((g: any) => g.id !== action.groupId);
      }
      return state;
    },
  );

  const handleGroupSearch = (value: string) => {
    setGroupSearchKey(value);
  };

  const memberGroupList = useMemo(() => {
    if (!groupSearchValue) return optimisticMemberGroups || [];
    const searchKeyLower = groupSearchValue.toLowerCase();
    return (optimisticMemberGroups || []).filter((group: ForumGroup) =>
      group?.forumGroup?.name?.toLowerCase().includes(searchKeyLower),
    );
  }, [optimisticMemberGroups, groupSearchValue]);

  const nonMemberGroupList = useMemo(() => {
    if (!groupSearchValue) return optimisticNonMemberGroups || [];
    const searchKeyLower = groupSearchValue.toLowerCase();
    return (optimisticNonMemberGroups || []).filter((group: any) =>
      group?.name?.toLowerCase().includes(searchKeyLower),
    );
  }, [optimisticNonMemberGroups, groupSearchValue]);

  const handleExit = (group: ForumGroup) => {
    const groupId = group.forumGroup.id;
    if (pendingRef.current.has(groupId)) return;
    pendingRef.current.add(groupId);
    startTransition(async () => {
      dispatchMemberGroup({type: 'remove', groupId});
      const response = await exitGroup({
        id: group.id,
        groupID: groupId,
        workspaceURL,
        workspaceURI,
      });
      pendingRef.current.delete(groupId);
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: i18n.t(response?.message || 'An error occurred'),
        });
      }
    });
  };

  const handleJoin = (group: ForumGroup) => {
    const groupId = group.id;
    if (pendingRef.current.has(groupId)) return;
    pendingRef.current.add(groupId);
    startTransition(async () => {
      dispatchNonMemberGroup({type: 'remove', groupId});
      const response = await joinGroup({
        groupID: groupId,
        userId,
        workspaceURL,
        workspaceURI,
      });
      pendingRef.current.delete(groupId);
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: i18n.t(response?.message || 'An error occurred'),
        });
      }
    });
  };

  const handlePin = (group: ForumGroup) => {
    const groupId = group.forumGroup.id;
    if (pendingRef.current.has(groupId)) return;
    pendingRef.current.add(groupId);
    startTransition(async () => {
      dispatchMemberGroup({type: 'toggle-pin', groupId});
      const response = await pinGroup({
        id: group.id,
        groupID: groupId,
        isPin: !group.isPin,
        workspaceURL,
        workspaceURI,
      });
      pendingRef.current.delete(groupId);
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: i18n.t(response?.message || 'An error occurred'),
        });
      }
    });
  };

  return (
    <div className="h-fit flex flex-col gap-6 bg-white p-4 rounded-lg">
      <div>
        <h1 className="font-semibold text-xl leading-[1.875rem]">
          {i18n.t(GROUPS)}
        </h1>
      </div>
      <GroupSearch onChange={handleGroupSearch} />
      {isLoggedIn && (
        <GroupActionList
          title={MEMBER}
          groups={memberGroupList}
          isMember={true}
          userId={userId}
          groupId={selectedGroup?.id}
          onExit={handleExit}
          onPin={handlePin}
        />
      )}
      <GroupActionList
        title={OTHER_GROUPS}
        groups={nonMemberGroupList}
        isMember={false}
        userId={userId}
        groupId={selectedGroup?.id}
        onJoin={handleJoin}
      />
    </div>
  );
}

export default GroupControls;

export function GroupControlsSkeleton() {
  return (
    <div className="w-full overflow-hidden mb-16 lg:mb-0">
      <div className="h-fit flex flex-col gap-6 bg-white p-4 rounded-lg">
        <Skeleton className="h-6 w-50" />
        <div className="w-full flex gap-2">
          <Skeleton className="w-4/5 h-8" />
          <Skeleton className="w-1/5 h-8" />
        </div>
        <div>
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex gap-2  ">
                <Skeleton className="rounded-full h-8 w-8" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="flex gap-2 my-4">
                <Skeleton className="rounded-full h-8 w-8" />
                <Skeleton className="h-8 w-full " />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
