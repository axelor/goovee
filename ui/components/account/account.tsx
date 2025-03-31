'use client';

import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import {MdOutlineAccountCircle} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components';
import type {ID} from '@/types';
import {SEARCH_PARAMS} from '@/constants';
import {getLoginURL} from '@/utils/url';

export function Account({
  baseURL = '',
  tenant,
}: {
  baseURL?: string;
  tenant?: ID | null;
}) {
  const pathname = usePathname();

  const {data: session} = useSession();
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  const openConfirmation = () => {
    setConfirmationDialog(true);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(false);
  };

  const loggedin = !!session;

  const loginURL = getLoginURL({
    callbackurl: pathname,
    workspaceURI: baseURL,
    tenant,
  });

  const handleLogout = () => {
    signOut({
      callbackUrl: loginURL,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <MdOutlineAccountCircle className="cursor-pointer text-foreground text-2xl" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {loggedin ? (
            <>
              <Link
                href={`${baseURL || ''}/account`}
                className="cursor-pointer">
                <DropdownMenuItem className="cursor-pointer">
                  {i18n.t('My Account')}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={openConfirmation}>
                {i18n.t('logout')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <Link href={loginURL}>
                <DropdownMenuItem className="cursor-pointer">
                  {i18n.t('login')}
                </DropdownMenuItem>
              </Link>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to logout?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              {i18n.t('Continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Account;
