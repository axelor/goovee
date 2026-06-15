'use client';

import {useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
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
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/ui/components';
import type {ID} from '@/types';
import {getLoginURL} from '@/utils/url';
import {getInitials} from '@/utils/names';
import {Link} from '@/ui/components/link';
import {authClient} from '@/lib/auth-client';
import {useSignOut} from '@/ui/hooks';

export function Account({
  baseURL = '',
  tenant,
}: {
  baseURL?: string;
  tenant?: ID | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {data: session} = authClient.useSession();
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  const user = session?.user;
  const userName = user?.simpleFullName || user?.name || '';
  const initials = getInitials(userName);

  const openConfirmation = () => {
    setConfirmationDialog(true);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(false);
  };

  const loggedin = !!session;

  const loginURL = getLoginURL({
    callbackurl: pathname + (searchParams.toString() ? `?${searchParams}` : ''),
    workspaceURI: baseURL,
    tenant,
  });

  const signOut = useSignOut();

  const handleLogout = async () => {
    await signOut();
    router.push(loginURL);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none">
          {loggedin ? (
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage
                src={user?.image || undefined}
                alt={userName}
                size={32}
              />
              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                {initials || (
                  <MdOutlineAccountCircle className="text-foreground text-2xl" />
                )}
              </AvatarFallback>
            </Avatar>
          ) : (
            <MdOutlineAccountCircle className="cursor-pointer text-foreground text-2xl" />
          )}
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
