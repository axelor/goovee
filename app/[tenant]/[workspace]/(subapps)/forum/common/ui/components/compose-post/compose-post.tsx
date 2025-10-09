'use client';
import {useMemo, useState} from 'react';
import {MdOutlineImage} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Avatar, AvatarImage, Button, Skeleton} from '@/ui/components';
import {getPartnerImageURL} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {UploadPost} from '@/subapps/forum/common/ui/components';
import {useForum} from '@/subapps/forum/common/ui/context';
import {
  DISABLED_SEARCH_PLACEHOLDER,
  JOIN_GROUP_TO_POST,
  START_A_POST,
} from '@/subapps/forum/common/constants';

export function ComposePost() {
  const {user, memberGroups, selectedGroup} = useForum();
  const {picture}: any = user || {};
  const {tenant} = useWorkspace();
  const [open, setOpen] = useState(false);

  const isLoggedIn = !!user?.id;

  const handleDialogOpen = () => {
    if (!isLoggedIn || !isAllowedToPost) return;
    setOpen(true);
  };

  const isAllowedToPost = selectedGroup
    ? memberGroups
        .map((group: any) => group.forumGroup.id)
        .includes(selectedGroup.id)
    : true;

  const isDisabled = useMemo(() => {
    return isLoggedIn ? !isAllowedToPost : true;
  }, [isLoggedIn, isAllowedToPost]);

  const groups = useMemo(
    () => memberGroups?.map((group: any) => group.forumGroup),
    [memberGroups],
  );

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div className="w-full overflow-hidden mb-16 lg:mb-0">
        <div className="bg-white px-4 py-4 rounded-t-lg flex items-center gap-[0.625rem]">
          <Avatar
            className={`rounded-full h-8 w-8 ${!isLoggedIn ? 'bg-gray-light' : ''}`}>
            {<AvatarImage src={getPartnerImageURL(picture?.id, tenant)} />}
          </Avatar>
          <Button
            onClick={handleDialogOpen}
            variant="outline"
            className={`flex-1 text-sm justify-start border font-normal ${
              isDisabled
                ? 'bg-gray-light hover:bg-gray-light text-gray-dark hover:text-gray-dark cursor-default border-none'
                : 'bg-white text-gray border-gray hover:bg-white hover:text-gray'
            }`}>
            {isLoggedIn
              ? isAllowedToPost
                ? i18n.t(START_A_POST)
                : i18n.t(JOIN_GROUP_TO_POST)
              : i18n.t(DISABLED_SEARCH_PLACEHOLDER)}
          </Button>
          {false && (
            <Button
              disabled={!isLoggedIn}
              className="bg-white hover:bg-white text-success hover:text-success-dark border-success hover:border-success-dark rounded-md border py-4 px-[0.688rem]
            disabled:bg-black/20 disabled:border-gray-700 disabled:text-gray-700">
              <MdOutlineImage className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
      <UploadPost
        open={open}
        groups={groups}
        selectedGroup={selectedGroup}
        onClose={handleClose}
      />
    </>
  );
}

export function ComposePostSkeleton() {
  return (
    <div className="bg-white px-4 py-4 rounded-t-lg flex items-center gap-[0.625rem]">
      <Skeleton className="rounded-full h-8 w-8" />;
      <Skeleton className="w-full h-8" />
    </div>
  );
}
