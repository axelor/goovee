// ---- CORE IMPORTS ---- //
import {ID} from '@goovee/orm';
import {PortalWorkspace} from '@/types';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {Group} from '@/subapps/forum/common/types/forum';
import {GroupNotification} from '@/subapps/forum/common/ui/components';
import {fetchGroupsByMembers} from '@/subapps/forum/common/action/action';

export async function MembersNoticationsWrapper({
  userId,
  group,
  workspaceID,
  sortBy,
}: {
  userId: ID;
  group: string;
  sortBy: string;
  workspaceID: PortalWorkspace['id'];
}) {
  const groupMembers = (await fetchGroupsByMembers({
    id: userId,
    searchKey: group,
    orderBy: {
      forumGroup: {
        name: sortBy,
      },
    },
    workspaceID,
  }).then(clone)) as Group[];

  return (
    <div>
      {groupMembers.map((group: Group) => (
        <GroupNotification group={group} key={group.id} />
      ))}
    </div>
  );
}
