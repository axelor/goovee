'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {CreatePost} from '@/subapps/forum/common/ui/components';
import type {Group} from '@/subapps/forum/common/types/forum';

interface uploadPostProps {
  open?: boolean;
  groups?: Group[];
  selectedGroup?: Group | null;
  onClose: () => void;
}

export const UploadPost = ({
  open,
  groups = [],
  selectedGroup = null,
  onClose,
}: uploadPostProps) => {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-50 m-auto flex h-fit max-h-[90vh] w-[calc(100%-2rem)] max-w-[620px] flex-col overflow-hidden rounded-[20px] bg-white shadow-xl focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}>
          <DialogPrimitive.Title className="sr-only">
            {i18n.t('New discussion')}
          </DialogPrimitive.Title>
          <CreatePost
            groups={groups}
            selectedGroup={selectedGroup}
            onClose={onClose}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default UploadPost;
