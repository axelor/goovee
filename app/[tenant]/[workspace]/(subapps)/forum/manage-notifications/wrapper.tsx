// ---- CORE IMPORTS ---- //
import type {ID} from '@/types';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {MemberGroup} from '@/subapps/forum/common/types/forum';
import {GroupNotification} from '@/subapps/forum/common/ui/components';
import {fetchGroupsByMembers} from '@/subapps/forum/common/action/action';

export async function MembersNoticationsWrapper({
  userId,
  group,
  workspaceURL,
  sortBy,
}: {
  userId: ID;
  group: string;
  sortBy: string;
  workspaceURL: string;
}) {
  const groupMembers = (await fetchGroupsByMembers({
    id: userId,
    searchKey: group,
    orderBy: {
      forumGroup: {
        name: sortBy,
      },
    },
    workspaceURL,
  }).then(clone)) as MemberGroup[];

  return (
    <div>
      {groupMembers.map((group: MemberGroup) => (
        <GroupNotification group={group} key={group.id} />
      ))}
    </div>
  );
}
