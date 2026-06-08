'use client';
import React, {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Avatar,
  AvatarImage,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Skeleton,
} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {NOTIFICATIONS_OPTIONS} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import {MemberGroup} from '@/subapps/forum/common/types/forum';
import {addGroupNotification} from '@/subapps/forum/common/action/action';

interface groupNotificationPros {
  group: MemberGroup;
}

export const GroupNotification = ({group}: groupNotificationPros) => {
  const {forumGroup, notificationSelect} = group;
  const [selectedOption, setSelectedOption] = useState<string | null>(
    notificationSelect,
  );

  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();

  useEffect(() => {
    setSelectedOption(notificationSelect);
  }, [notificationSelect]);

  const handleChange = async (notificationType: string) => {
    const prevType = selectedOption;
    setSelectedOption(notificationType);
    const {id, forumGroup} = group;
    const response = await addGroupNotification({
      id,
      groupID: forumGroup.id,
      notificationType,
      workspaceURL,
      workspaceURI,
    });

    if (!response?.success) {
      setSelectedOption(prevType);
      toast({
        variant: 'destructive',
        title: i18n.t(response?.message || 'An error occurred'),
      });
    }
  };

  return (
    <div className="py-4">
      <div className="w-full grid grid-cols-[1fr_4fr] my-4 ">
        <div className="flex items-center gap-3">
          <Avatar className="rounded-full h-6 w-6">
            <AvatarImage
              src={
                group.forumGroup?.image?.id
                  ? withBasePath(
                      `${workspaceURI}/${SUBAPP_CODES.forum}/api/group/${group.forumGroup?.id}/image`,
                    )
                  : withBasePath(NO_IMAGE_URL)
              }
              alt={forumGroup.name}
              size={24}
            />
          </Avatar>
          <span className="text-sm">{i18n.t(forumGroup.name)}</span>
        </div>
        <RadioGroup
          className="grid grid-cols-4 text-center"
          onValueChange={handleChange}>
          {NOTIFICATIONS_OPTIONS.map(item => (
            <div key={item.id} className="flex items-center justify-center">
              <RadioGroupItem
                value={item.value}
                id={item.value}
                checked={selectedOption === item.value}
                className={`border-muted-foreground ${selectedOption === item.value ? ' border-success text-success' : 'border text-white'}`}
              />
            </div>
          ))}
        </RadioGroup>
      </div>
      <Separator />
    </div>
  );
};

export default GroupNotification;

export function ForumNotificationSkeleton() {
  return (
    <section className="py-2 w-full rounded-sm bg-white">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_4fr] mt-12">
          <div className="flex gap-2 items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-full h-8" />
          </div>
          <div className="grid grid-cols-4 text-center align-middle text-sm font-normal gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex w-full items-center justify-center">
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
