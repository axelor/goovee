'use client';

import {useRouter} from 'next/navigation';
import {
  MdOutlinePushPin,
  MdMoreVert,
  MdOutlineMarkChatRead,
  MdNotificationsNone,
  MdExitToApp,
  MdOutlineGroupAdd,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Avatar,
  AvatarImage,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/components';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  ASK_TO_JOIN,
  LEAVE_THIS_GROUP,
  MARK_AS_READ,
  NOTIFICATIONS,
  NOTIFICATIONS_OPTIONS,
  PIN,
  REMOVE_PIN,
} from '@/subapps/forum/common/constants';
import {addGroupNotification} from '@/subapps/forum/common/action/action';
import {ForumGroup, Group} from '@/subapps/forum/common/types/forum';

export const GroupActionList = ({
  title,
  groups,
  isMember = true,
  userId = '',
  groupId,
  onExit,
  onJoin,
  onPin,
}: {
  title: string;
  groups: any;
  isMember?: boolean;
  userId?: string;
  groupId?: string;
  onExit?: (group: ForumGroup) => void;
  onJoin?: (group: ForumGroup) => void;
  onPin?: (group: ForumGroup) => void;
}) => {
  const router = useRouter();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();

  const handleNotifications = async (
    group: Group,
    notificationType: string,
  ) => {
    const {id, forumGroup} = group;
    const response = await addGroupNotification({
      id,
      groupID: forumGroup.id,
      notificationType,
      workspaceURL,
      workspaceURI,
    });

    if (response.success) {
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: i18n.t(response.message || 'An error occurred'),
      });
    }
  };

  const handlePath = (id: string) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.forum}/group/${id}`);
  };

  return (
    <div>
      <h1 className="font-semibold text-base leading-6 mb-6">
        {i18n.t(title)}
      </h1>
      <div className="flex flex-col gap-4">
        {groups?.map((group: any) => {
          const id = group?.forumGroup?.id || group?.id;
          const imageId = group?.forumGroup?.image?.id || group?.image?.id;
          const groupImage = imageId
            ? `${workspaceURI}/${SUBAPP_CODES.forum}/api/group/${id}/image`
            : NO_IMAGE_URL;

          return (
            <Collapsible key={group?.id}>
              <div
                className={`w-full flex-shrink-0 flex justify-between items-center gap-2 py-1 rounded ${groupId && groupId === (isMember ? group.forumGroup.id : group.id) ? 'bg-success-light px-1' : ''}`}>
                <div
                  onClick={() => handlePath(group?.forumGroup?.id || group?.id)}
                  className="flex items-center gap-2">
                  <Avatar className="rounded-lg h-6 w-6">
                    <AvatarImage src={groupImage} />
                  </Avatar>
                  <p className="font-normal text-sm leading-5 line-clamp-1 cursor-pointer">
                    {group?.forumGroup?.name || group?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {false && (
                    <div className="px-1 bg-success/10 cursor-pointer rounded-sm leading-[0.938rem]">
                      <span className="text-success text-[0.625rem]">2</span>
                    </div>
                  )}
                  {group?.isPin && (
                    <MdOutlinePushPin className="cursor-pointer w-4 h-4" />
                  )}
                  {userId && (
                    <CollapsibleTrigger>
                      <MdMoreVert className="cursor-pointer" />
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-col gap-2">
                  {isMember && (
                    <>
                      {false && (
                        <div className="flex items-center gap-[0.625rem] px-2">
                          <MdOutlineMarkChatRead className="w-4 h-4" />
                          <span className="w-full text-xs leading-[1.125rem] font-normal cursor-pointer">
                            {i18n.t(MARK_AS_READ)}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-[0.625rem] px-2"
                        onClick={() => onPin?.(group)}>
                        <MdOutlinePushPin className="w-4 h-4" />
                        <span className="w-full text-xs leading-[1.125rem] font-normal cursor-pointer">
                          {!group?.isPin ? i18n.t(PIN) : i18n.t(REMOVE_PIN)}
                        </span>
                      </div>
                    </>
                  )}

                  {false && (
                    <Popover>
                      <PopoverTrigger>
                        <div className="flex items-center gap-[0.625rem] px-2">
                          <MdNotificationsNone className="w-4 h-4" />
                          <span className="w-full text-left text-xs leading-[1.125rem] font-normal cursor-pointer">
                            {i18n.t(NOTIFICATIONS)}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="p-0">
                        <div className="flex flex-col gap-[0.625rem] py-4 bg-white rounded-lg text-xs leading-[1.125rem]">
                          {NOTIFICATIONS_OPTIONS.map(option => (
                            <div
                              key={option.id}
                              className={`cursor-pointer px-4 ${option.value === group?.notificationSelect ? 'bg-success-light' : ''}`}
                              onClick={() =>
                                handleNotifications(group, option.value)
                              }>
                              {i18n.t(option.title)}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {isMember ? (
                    <div
                      className="flex items-center gap-[0.625rem] px-2 cursor-pointer"
                      onClick={() => onExit?.(group)}>
                      <MdExitToApp className="w-4 h-4" />
                      <span className="w-full text-xs leading-[1.125rem] font-normal">
                        {i18n.t(LEAVE_THIS_GROUP)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-[0.625rem] px-2 cursor-pointer"
                      onClick={() => onJoin?.(group)}>
                      <MdOutlineGroupAdd className="w-4 h-4" />
                      <span className="w-full text-xs leading-[1.125rem] font-normal">
                        {i18n.t(ASK_TO_JOIN)}
                      </span>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default GroupActionList;
