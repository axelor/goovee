'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/core/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Separator,
} from '@/ui/components';
import {PortalWorkspace} from '@/types';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {removeWorkpace} from '@/app/[tenant]/[workspace]/account/settings/action';

export default function Content({workspace}: {workspace: PortalWorkspace}) {
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);

  const {workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const handleLeaveWorkspace = () => {
    setIsAlertOpen(true);
  };

  const handleCancel = () => {
    setIsAlertOpen(false);
  };

  const handleConfirmLeave = async () => {
    setIsAlertOpen(false);
    try {
      const result = await removeWorkpace({workspaceURL});

      if (result?.success) {
        toast({
          variant: 'success',
          description: i18n.get('Workspace has been removed.'),
        });
      } else {
        toast({
          variant: 'destructive',
          description: i18n.get('Something went wrong while searching!'),
        });
      }
      router.refresh();
    } catch (error) {}
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">{i18n.get('Settings')}</h2>
      <div className="flex flex-col gap-2">
        <p className="mb-0 font-medium">{i18n.get('Leave the workspace')}</p>
        <Button
          variant="destructive"
          className="w-fit"
          onClick={handleLeaveWorkspace}>
          {i18n.get('Leave workspace')}
        </Button>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-2xl p-4 gap-0">
          <AlertDialogHeader className="space-y-0">
            <AlertDialogTitle className="text-xl">
              {i18n.get('Leave the workspace')}
            </AlertDialogTitle>
            <Separator className="mt-4" />
            <AlertDialogDescription className="text-black flex flex-col gap-6 !my-6">
              <span className="text-xl font-semibold">
                {i18n.get(
                  `Are you sure you want to leave the workspace ${workspace.name}?`,
                )}
              </span>
              <span>
                {i18n.get(
                  'If so, you will not be able to access this workspace anymore and will need to create a new account to join it.',
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-10">
            <AlertDialogCancel
              className="w-full text-success hover:text-success border-success bg-white"
              onClick={handleCancel}>
              {i18n.get('No, I changed my mind')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive hover:bg-destructive/80 !ml-0"
              onClick={handleConfirmLeave}>
              {i18n.get('Yes, leave workspace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
