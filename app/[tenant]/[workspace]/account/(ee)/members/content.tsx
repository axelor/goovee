'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdDeleteOutline, MdKeyboardArrowDown} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/components/accordion';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {Avatar, AvatarImage, AvatarFallback} from '@/ui/components/avatar';
import {Button} from '@/ui/components/button';
import {cn} from '@/utils/css';
import {useWorkspace} from '../../../workspace-context';
import {getInitials} from '@/utils/names';
import {getPartnerImageURL} from '@/utils/files';
import {SUBAPP_WITH_ROLES} from '@/constants';
import {useToast} from '@/ui/hooks';
import {authClient} from '@/lib/auth-client';

// ---- LOCAL IMPORTS ---- //
import {Authorization, Role} from '../../common/types';
import {deleteInvite} from './invite/action';
import {RoleLabel} from '../../common/constants';
import {
  deleteMember,
  updateInviteApplication,
  updateInviteAuthentication,
  updateMemberApplication,
  updateMemberAuthentication,
} from './action';

function Members({members, availableApps}: any) {
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const {workspaceURI, workspaceURL, tenant} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  const openConfirmation = (member: any) => () => {
    setConfirmationDialog(member);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(null);
  };

  const handleUpdateApplication =
    (member: any, app: any) => async (value: 'yes' | 'no') => {
      const result = await updateMemberApplication({
        member,
        app,
        value,
        workspaceURL,
        workspaceURI,
      });

      if (!result || 'error' in result) {
        toast({
          title: i18n.t('Error updating invite'),
          variant: 'destructive',
        });
      } else {
        router.refresh();
      }
    };

  const handleUpdateAuthentication =
    (member: any, app: any) => async (value: Authorization) => {
      const result = await updateMemberAuthentication({
        member,
        app,
        value,
        workspaceURL,
        workspaceURI,
      });

      if (!result || 'error' in result) {
        toast({
          title: i18n.t('Error updating invite'),
          variant: 'destructive',
        });
      } else {
        router.refresh();
      }
    };

  const handleDeleteMember = async () => {
    const {id, email} = confirmationDialog;
    closeConfirmation();

    const result =
      (await deleteMember({
        member: {id, email},
        workspaceURL,
        workspaceURI,
      })) || ({error: true} as any);

    if (!result || 'error' in result) {
      toast({
        title: result.message || i18n.t('Error deleting member'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: i18n.t('Member deleted.'),
        variant: 'success',
      });

      router.refresh();
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-medium">{i18n.t('Members')}</h2>
        <Accordion type="single" collapsible>
          {members.map((member: any) => {
            const {
              id,
              picture,
              fullName,
              emailAddress,
              contactWorkspaceConfig,
            } = member;
            const isAdminContact = contactWorkspaceConfig?.isAdmin;

            const isPartner = !member.isContact;
            const isOwner = isPartner;
            const currentUser = member.id === user?.id;

            const roleLabel = i18n.t(
              RoleLabel[
                isOwner ? Role.owner : isAdminContact ? Role.admin : Role.user
              ],
            );

            return (
              <AccordionItem value={id} key={id} className="border-b">
                <div className="flex flex-col gap-2 py-2 px-4">
                  <div className="grid grid-cols-4 items-center row-gap gap-x-6 gap-y-2">
                    <div className="flex items-center col-span-2 lg:col-span-1 gap-[7.5rem]">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={getPartnerImageURL(picture?.id, tenant, {
                              noimage: true,
                              noimageSrc: '/images/profile.png',
                            })}
                          />
                          <AvatarFallback>
                            {getInitials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm line-clamp-1">{fullName}</p>
                      </div>
                    </div>
                    <p className="hidden lg:block text-sm">
                      {emailAddress?.address}
                    </p>
                    <p className="text-sm">{roleLabel}</p>
                    <div className="flex items-center gap-6 justify-self-end">
                      {isOwner || currentUser ? (
                        <div />
                      ) : (
                        <MdDeleteOutline
                          className="hidden lg:block size-6 text-destructive cursor-pointer"
                          onClick={openConfirmation(member)}
                        />
                      )}

                      <AccordionTrigger disabled={isAdminContact || isOwner}>
                        {isAdminContact || isOwner ? (
                          <div className="size-6" />
                        ) : (
                          <MdKeyboardArrowDown
                            className={'size-6 cursor-pointer'}
                          />
                        )}
                      </AccordionTrigger>
                    </div>
                    <p className="lg:hidden text-sm col-span-4">
                      {emailAddress?.address}
                    </p>
                    {isOwner || currentUser ? null : (
                      <div
                        className="lg:hidden flex items-center gap-4 cursor-pointer col-span-4"
                        onClick={openConfirmation(member)}>
                        <p className="text-destructive">
                          {i18n.t('Delete member')}
                        </p>
                        <MdDeleteOutline className="lg:hidden size-6 text-destructive cursor-pointer" />
                      </div>
                    )}
                  </div>
                  <AccordionContent
                    className={cn({hidden: isAdminContact || isOwner})}>
                    <div className="space-y-[1px]">
                      {availableApps?.map((app: any) => {
                        const {name, code} = app;

                        const permission =
                          contactWorkspaceConfig?.contactAppPermissionList.find(
                            (a: any) => a?.app?.code === code,
                          );

                        return (
                          <div className="px-2 border-b" key={code}>
                            <div className="grid grid-cols-[20%_20%_20%] items-center px-4 py-2 gap-6">
                              <p className="text-xs font-bold">{name}</p>
                              <Select
                                value={permission ? 'yes' : 'no'}
                                onValueChange={handleUpdateApplication(
                                  member,
                                  app,
                                )}>
                                <SelectTrigger className="text-xs w-16">
                                  <SelectValue
                                    placeholder={i18n.t('Select access')}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    {label: i18n.t('Yes'), value: 'yes'},
                                    {label: i18n.t('No'), value: 'no'},
                                  ].map((option: any) => (
                                    <SelectItem
                                      className="text-xs"
                                      value={option.value}
                                      key={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {SUBAPP_WITH_ROLES.includes(code) && (
                                <Select
                                  defaultValue={
                                    permission?.roleSelect ||
                                    Authorization.restricted
                                  }
                                  onValueChange={handleUpdateAuthentication(
                                    member,
                                    app,
                                  )}
                                  disabled={!permission}>
                                  <SelectTrigger className="text-xs w-28">
                                    <SelectValue
                                      placeholder={i18n.t(
                                        'Select authorization',
                                      )}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      {
                                        label: i18n.t('Restricted'),
                                        value: Authorization.restricted,
                                      },
                                      {
                                        label: i18n.t('Total'),
                                        value: Authorization.total,
                                      },
                                    ].map((option: any) => (
                                      <SelectItem
                                        className="text-xs"
                                        value={option.value}
                                        key={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
      <AlertDialog open={Boolean(confirmationDialog)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to delete member?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember}>
              {i18n.t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Invited({invites, availableApps}: any) {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  const openConfirmation = (invite: any) => () => {
    setConfirmationDialog(invite);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(null);
  };

  const handleUpdateApplication =
    (invite: any, app: any) => async (value: 'yes' | 'no') => {
      const result = await updateInviteApplication({
        invite,
        app,
        value,
        workspaceURL,
        workspaceURI,
      });

      if (result) {
        if ('error' in result) {
          toast({
            title: i18n.t('Error updating invite'),
            variant: 'destructive',
          });
        } else {
          router.refresh();
        }
      }
    };

  const handleUpdateAuthentication =
    (invite: any, app: any) => async (value: Authorization) => {
      const result = await updateInviteAuthentication({
        invite,
        app,
        value,
        workspaceURL,
        workspaceURI,
      });

      if (result) {
        if ('error' in result) {
          toast({
            title: i18n.t('Error updating invite'),
            variant: 'destructive',
          });
        } else {
          router.refresh();
        }
      }
    };

  const handleDeleteInvite = async () => {
    const id = confirmationDialog?.id;
    closeConfirmation();

    const result =
      (await deleteInvite({
        id,
        workspaceURL,
      })) || ({error: true} as any);

    if ('error' in result) {
      toast({
        title: result.message || i18n.t('Error deleting invite'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: i18n.t('Invite deleted.'),
        variant: 'success',
      });

      router.refresh();
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">{i18n.t('Invited')}</h2>
          <Link href={`${workspaceURI}/account/members/invite`}>
            <Button variant="success">{i18n.t('Invite new members')}</Button>
          </Link>
        </div>
        <Accordion type="single" collapsible>
          {invites.map((invite: any) => {
            const {emailAddress, id, ...rest} = invite;

            const contactWorkspaceConfig = rest.contactAppPermissionList?.[0];

            const isAdminContact = contactWorkspaceConfig?.isAdmin;
            return (
              <AccordionItem value={id} key={id}>
                <div className="flex flex-col gap-4 lg:gap-2 py-2 px-4">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex justify-between basis-[60%] lg:basis-[40%]">
                      <p className="text-sm">{emailAddress?.address}</p>
                      <p className="text-sm">
                        {i18n.t(
                          RoleLabel[isAdminContact ? Role.admin : Role.user],
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <MdDeleteOutline
                        className="size-6 text-destructive cursor-pointer"
                        onClick={openConfirmation(invite)}
                      />

                      <AccordionTrigger disabled={isAdminContact}>
                        {isAdminContact ? (
                          <div className="size-6" />
                        ) : (
                          <MdKeyboardArrowDown className="size-6 cursor-pointer" />
                        )}
                      </AccordionTrigger>
                    </div>
                  </div>
                  <AccordionContent className={cn({hidden: isAdminContact})}>
                    <div className="space-y-[1px]">
                      {availableApps?.map((app: any) => {
                        const {code, name} = app;
                        const permission =
                          contactWorkspaceConfig?.contactAppPermissionList.find(
                            (a: any) => a?.app?.code === code,
                          );

                        return (
                          <div className="px-2 border-b" key={code}>
                            <div className="grid grid-cols-[20%_20%_20%] items-center px-4 py-2 gap-6">
                              <p className="text-xs font-bold">{name}</p>
                              <Select
                                value={permission ? 'yes' : 'no'}
                                onValueChange={handleUpdateApplication(
                                  invite,
                                  app,
                                )}>
                                <SelectTrigger className="text-xs w-16">
                                  <SelectValue
                                    placeholder={i18n.t('Select access')}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    {label: i18n.t('Yes'), value: 'yes'},
                                    {label: i18n.t('No'), value: 'no'},
                                  ].map((option: any) => (
                                    <SelectItem
                                      className="text-xs"
                                      value={option.value}
                                      key={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {SUBAPP_WITH_ROLES.includes(code) && (
                                <Select
                                  defaultValue={
                                    permission?.roleSelect ||
                                    Authorization.restricted
                                  }
                                  disabled={!permission}
                                  onValueChange={handleUpdateAuthentication(
                                    invite,
                                    app,
                                  )}>
                                  <SelectTrigger className="text-xs w-28">
                                    <SelectValue
                                      placeholder={i18n.t(
                                        'Select authorization',
                                      )}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      {
                                        label: i18n.t('Restricted'),
                                        value: Authorization.restricted,
                                      },
                                      {
                                        label: i18n.t('Total'),
                                        value: Authorization.total,
                                      },
                                    ].map((option: any) => (
                                      <SelectItem
                                        className="text-xs"
                                        value={option.value}
                                        key={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
      <AlertDialog open={Boolean(confirmationDialog)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to delete invite?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvite}>
              {i18n.t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Content({
  members,
  invites,
  availableApps,
  canInviteMembers,
}: any) {
  return (
    <div className="space-y-10">
      <Members members={members} availableApps={availableApps} />
      {canInviteMembers && (
        <Invited invites={invites} availableApps={availableApps} />
      )}
    </div>
  );
}
