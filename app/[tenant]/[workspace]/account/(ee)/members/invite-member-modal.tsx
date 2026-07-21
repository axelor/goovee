'use client';

import {useMemo, useState} from 'react';
import {MdPersonOutline, MdApps, MdClose} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  Dialog,
  DialogContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {cn} from '@/utils/css';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {AccountToggle} from '../../common/ui/components';
import {Authorization, Role, type InviteAppsConfig} from '../../common/types';
import {sendInvites} from './invite/action';
import {updateMemberApplication, updateMemberAuthentication} from './action';

// Member shape derived from the ORM finder (type-only import, erased at build).
type MembersResult = Awaited<
  ReturnType<typeof import('../../common/orm/members').findMembers>
>;
type ContactMember = NonNullable<
  NonNullable<Extract<MembersResult, {contacts: unknown}>['contacts']>[number]
>;

type AvailableApp = {
  id: string;
  name: string;
  code: string;
  authorization?: boolean;
};
type Perm = {access: boolean; level: Authorization};
type Mode = 'invite' | 'edit';

const EMAIL_RE = /\S+@\S+\.\S+/;

export function InviteMemberModal({
  mode,
  open,
  onClose,
  onSaved,
  availableApps,
  member,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  availableApps: AvailableApp[];
  member?: ContactMember;
}) {
  const {toast} = useToast();
  const {workspaceURL, workspaceURI} = useWorkspace();
  const isEdit = mode === 'edit';

  // Current member permissions keyed by app code (edit mode).
  const memberPerms: Record<string, Authorization> = useMemo(() => {
    const list = member?.contactWorkspaceConfig?.contactAppPermissionList || [];
    return list.reduce<Record<string, Authorization>>((acc, p) => {
      if (p?.app?.code)
        acc[p.app.code] =
          (p.roleSelect as Authorization) ?? Authorization.restricted;
      return acc;
    }, {});
  }, [member]);

  const [email] = useState<string>(
    isEdit ? (member?.emailAddress?.address ?? '') : '',
  );
  const [emailInput, setEmailInput] = useState<string>('');
  const [role, setRole] = useState<Role>(
    isEdit && member?.contactWorkspaceConfig?.isAdmin ? Role.admin : Role.user,
  );
  const [perms, setPerms] = useState<Record<string, Perm>>(() =>
    Object.fromEntries(
      availableApps.map(a => [
        a.code,
        {
          access: isEdit ? a.code in memberPerms : false,
          level: isEdit
            ? (memberPerms[a.code] ?? Authorization.restricted)
            : Authorization.restricted,
        },
      ]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const currentEmail = isEdit ? email : emailInput;
  const enabledCount = availableApps.filter(a => perms[a.code]?.access).length;
  const allOn =
    enabledCount === availableApps.length && availableApps.length > 0;
  const valid = isEdit || EMAIL_RE.test(emailInput);

  const setAccess = (code: string, v: boolean) =>
    setPerms(p => ({...p, [code]: {...p[code], access: v}}));
  const setLevel = (code: string, v: Authorization) =>
    setPerms(p => ({...p, [code]: {...p[code], level: v}}));
  const toggleAll = () =>
    setPerms(p =>
      Object.fromEntries(
        availableApps.map(a => [a.code, {...p[a.code], access: !allOn}]),
      ),
    );

  const handleInvite = async () => {
    const apps = availableApps.reduce<InviteAppsConfig>(
      (acc, a) => ({
        ...acc,
        [a.code]: {
          code: a.code,
          access: perms[a.code]?.access ? 'yes' : 'no',
          ...(a.authorization ? {authorization: perms[a.code]?.level} : {}),
        },
      }),
      {},
    );

    const result = await sendInvites({
      emails: emailInput,
      role,
      apps,
      workspaceURL,
      workspaceURI,
    });

    if ('success' in result) {
      toast({
        variant: 'success',
        title: result.message || i18n.t('Invites send successfully'),
      });
      onSaved();
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: result.message || i18n.t('Error sending invites'),
      });
    }
  };

  const handleSaveAccess = async () => {
    if (!member) return;
    const ref = {id: member.id};
    for (const a of availableApps) {
      const desired = perms[a.code];
      const hadAccess = a.code in memberPerms;
      const app = {id: a.id, code: a.code};

      if (desired.access !== hadAccess) {
        await updateMemberApplication({
          workspaceURL,
          workspaceURI,
          member: ref,
          app,
          value: desired.access ? 'yes' : 'no',
        });
      }

      // Authorization only matters for scoped apps that keep access.
      if (desired.access && a.authorization) {
        const currentLevel = memberPerms[a.code];
        const justGranted = !hadAccess;
        if (justGranted || desired.level !== currentLevel) {
          await updateMemberAuthentication({
            workspaceURL,
            workspaceURI,
            member: ref,
            app,
            value: desired.level,
          });
        }
      }
    }

    toast({variant: 'success', title: i18n.t('Access updated successfully.')});
    onSaved();
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting || !valid) return;
    setSubmitting(true);
    try {
      if (isEdit) await handleSaveAccess();
      else await handleInvite();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: i18n.t('An unexpected error occurred'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit
    ? i18n.t('Access for {0}', member?.fullName || member?.name || '')
    : i18n.t('Invite a member');

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-[620px] max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-ink-100 bg-gradient-to-br from-royal-pale to-white">
          <span className="w-[42px] h-[42px] rounded-[11px] bg-royal text-white grid place-items-center shrink-0">
            <MdPersonOutline className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-ink-900 tracking-[-0.01em] mb-0">
              {title}
            </h3>
            <p className="text-[12.5px] text-ink-500 mb-0">
              {i18n.t('Set access application by application')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-ink-150 text-ink-600 grid place-items-center shrink-0">
            <MdClose className="size-[15px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex flex-col gap-5">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-3.5">
            <Field label={i18n.t('Member email')}>
              <Input
                type="email"
                value={currentEmail}
                disabled={isEdit}
                onChange={e => setEmailInput(e.target.value)}
                placeholder={i18n.t('firstname.name@company.com')}
              />
            </Field>
            <Field label={i18n.t('Role')}>
              <Select
                value={role}
                onValueChange={v => setRole(v as Role)}
                disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.user}>{i18n.t('User')}</SelectItem>
                  <SelectItem value={Role.admin}>{i18n.t('Admin')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Permissions matrix — only for the "user" role; admins get all apps by default */}
          {role === Role.user ? (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-ink-900 mb-0">
                    {i18n.t('Application access')}
                  </h4>
                  <p className="text-xs text-ink-500 mb-0">
                    {i18n.t('{0} application(s) enabled', String(enabledCount))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[12.5px] font-bold text-royal">
                  {allOn ? i18n.t('Disable all') : i18n.t('Enable all')}
                </button>
              </div>

              <div className="border border-ink-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_96px_150px] gap-2.5 px-3.5 py-2.5 bg-ink-25 border-b border-ink-100">
                  {[
                    i18n.t('Application'),
                    i18n.t('Access'),
                    i18n.t('Authorization'),
                  ].map(h => (
                    <span
                      key={h}
                      className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-ink-500">
                      {h}
                    </span>
                  ))}
                </div>
                {availableApps.map((a, i) => {
                  const on = perms[a.code]?.access;
                  return (
                    <div
                      key={a.code}
                      className={cn(
                        'grid grid-cols-[1fr_96px_150px] gap-2.5 items-center px-3.5 py-2.5',
                        i < availableApps.length - 1 &&
                          'border-b border-ink-100',
                        on ? 'bg-white' : 'bg-ink-25',
                      )}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'w-[30px] h-[30px] rounded-[7px] grid place-items-center shrink-0',
                            on
                              ? 'bg-royal-pale text-royal'
                              : 'bg-ink-100 text-ink-400',
                          )}>
                          <MdApps className="size-[15px]" />
                        </span>
                        <span
                          className={cn(
                            'text-[13px] font-semibold truncate',
                            on ? 'text-ink-900' : 'text-ink-500',
                          )}>
                          {i18n.t(a.name)}
                        </span>
                      </div>
                      <AccountToggle
                        checked={on}
                        onCheckedChange={v => setAccess(a.code, v)}
                        aria-label={a.name}
                      />
                      {a.authorization ? (
                        <div
                          className={cn(
                            !on && 'opacity-40 pointer-events-none',
                          )}>
                          <Select
                            value={perms[a.code]?.level}
                            onValueChange={v =>
                              setLevel(a.code, v as Authorization)
                            }
                            disabled={!on}>
                            <SelectTrigger className="h-9 text-[12.5px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Authorization.restricted}>
                                {i18n.t('Restricted')}
                              </SelectItem>
                              <SelectItem value={Authorization.total}>
                                {i18n.t('Full')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-ink-400">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 mx-0.5 text-[11.5px] text-ink-500">
                {i18n.t(
                  '"Restricted" limits access to the member\'s own data; "Full" grants access to all company data.',
                )}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-royal-border bg-royal-pale px-4 py-3.5 text-[13px] text-royal-dark">
              {i18n.t(
                'An administrator has access to all applications by default.',
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-ink-100">
          <Button
            variant="royal-outline"
            onClick={onClose}
            disabled={submitting}>
            {i18n.t('Cancel')}
          </Button>
          {isEdit ? (
            <Button
              variant="royal"
              onClick={handleSubmit}
              disabled={submitting}>
              {i18n.t('Save access')}
            </Button>
          ) : (
            <Button
              variant="mint"
              onClick={handleSubmit}
              disabled={!valid || submitting}>
              {i18n.t('Send invitation')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-ink-800 mb-0">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default InviteMemberModal;
