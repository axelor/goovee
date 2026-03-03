'use client';

// ---- CORE IMPORTS ---- //
import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';

export const ThreadHeader = ({group}: {group: any}) => {
  const {workspaceURI} = useWorkspace();
  return (
    <div className="flex items-center gap-2 px-4 pb-4 border-b">
      <Avatar className="rounded-lg h-6 w-6">
        <AvatarImage
          src={
            group?.image?.id
              ? `${workspaceURI}/${SUBAPP_CODES.forum}/api/group/${group.id}/image`
              : NO_IMAGE_URL
          }
        />
      </Avatar>
      <p className="font-normal text-xs leading-[0.875rem] line-clamp-1">
        {group?.name}
      </p>
    </div>
  );
};

export default ThreadHeader;
