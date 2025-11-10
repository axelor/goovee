'use client';
import {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Skeleton} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {ForumGroup} from '@/subapps/forum/common/types/forum';
import {useForum} from '@/subapps/forum/common/ui/context';
import {
  GroupActionList,
  Search as GroupSearch,
} from '@/subapps/forum/common/ui/components';
import {GROUPS, MEMBER, OTHER_GROUPS} from '@/subapps/forum/common/constants';

export function GroupControls() {
  const {memberGroups, nonMemberGroups, user, selectedGroup} = useForum();
  const [memberGroupList, setMemberGroupList] = useState<ForumGroup[]>(
    memberGroups || [],
  );
  const [nonMemberGroupList, setNonMemberGroupList] = useState<ForumGroup[]>(
    nonMemberGroups || [],
  );
  const userId = user?.id as string;
  const isLoggedIn = !!user?.id;
  const [groupSearchValue, setGroupSearchKey] = useState<string>('');
  const handleGroupSearch = (value: string) => {
    setGroupSearchKey(value);
  };

  useEffect(() => {
    const getGroups = async () => {
      try {
        if (groupSearchValue) {
          const searchKeyLower = groupSearchValue.toLowerCase();

          if (isLoggedIn) {
            const filteredMemberGroups = memberGroups.filter(
              (group: ForumGroup) =>
                group?.forumGroup?.name?.toLowerCase().includes(searchKeyLower),
            );
            setMemberGroupList(filteredMemberGroups);
          }
          const filteredNonMemberGroups = nonMemberGroups.filter(
            (group: ForumGroup) =>
              group?.name?.toLowerCase().includes(searchKeyLower),
          );
          setNonMemberGroupList(filteredNonMemberGroups);
        } else {
          setMemberGroupList(memberGroups);
          setNonMemberGroupList(nonMemberGroups);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getGroups();
  }, [isLoggedIn, groupSearchValue, memberGroups, nonMemberGroups]);

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
        />
      )}
      <GroupActionList
        title={OTHER_GROUPS}
        groups={nonMemberGroupList}
        isMember={false}
        userId={userId}
        groupId={selectedGroup?.id}
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
