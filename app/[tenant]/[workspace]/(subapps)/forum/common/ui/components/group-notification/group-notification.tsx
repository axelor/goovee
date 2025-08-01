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
} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {NOTIFICATIONS_OPTIONS} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import {Group} from '@/subapps/forum/common/types/forum';
import {addGroupNotification} from '@/subapps/forum/common/action/action';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';

interface groupNotificationPros {
  group: Group;
}

export const GroupNotification = ({group}: groupNotificationPros) => {
  const [selectedOption, setSelectedOption] = useState<string | null>('');
  const {forumGroup, id, notificationSelect, isPin} = group;

  const {workspaceURL, tenant} = useWorkspace();
  const {toast} = useToast();

  useEffect(() => {
    setSelectedOption(notificationSelect);
  }, []);

  const handleChange = async (notificationType: string) => {
    const {id, forumGroup} = group;
    const response = await addGroupNotification({
      id,
      groupID: forumGroup.id,
      notificationType,
      workspaceURL,
    });

    if (response?.success) {
      setSelectedOption(notificationType);
    } else {
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
                  ? `${workspaceURL}/${SUBAPP_CODES.forum}/api/group/${group.forumGroup?.id}/image`
                  : NO_IMAGE_URL
              }
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
