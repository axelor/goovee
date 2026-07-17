'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdAdd, MdOutlineEdit} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {SectionHeader} from '../../common/ui/components';
import {RoleLabel} from '../../common/constants';
import {Role} from '../../common/types';
import {InviteMemberModal} from './invite-member-modal';

type AvailableApp = {
  id: string;
  name: string;
  code: string;
  authorization?: boolean;
};
type Editing = {mode: 'invite' | 'edit'; member?: any} | null;

const GRID =
  'grid grid-cols-[1.4fr_1.6fr_120px_130px_110px] gap-3 items-center';

function getInitials(member: any): string {
  const name = member?.fullName || member?.name || '';
  return name.trim().slice(0, 2).toUpperCase() || 'A';
}

export default function Content({
  members = [],
  availableApps = [],
  canInviteMembers,
}: {
  members?: any[];
  invites?: any[];
  availableApps?: AvailableApp[];
  canInviteMembers?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title={i18n.t('Members')}
          description={i18n.t(
            '{0} member(s) in this workspace',
            String(members.length),
          )}
        />
        {canInviteMembers && (
          <Button
            variant="mint"
            className="shrink-0"
            onClick={() => setEditing({mode: 'invite'})}>
            <MdAdd className="size-4" />
            {i18n.t('Invite a member')}
          </Button>
        )}
      </div>

      <div className="bg-white border border-ink-100 rounded-xl shadow-xs overflow-hidden">
        {/* Column header */}
        <div
          className={cn(
            GRID,
            'px-[22px] py-3 bg-ink-25 border-b border-ink-100',
          )}>
          {[
            i18n.t('Member'),
            i18n.t('Email'),
            i18n.t('Role'),
            i18n.t('Access'),
            '',
          ].map((h, i) => (
            <span
              key={i}
              className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-500">
              {h}
            </span>
          ))}
        </div>

        {members.map((m, i) => {
          const isOwner = !m.isContact;
          const isAdmin = m.contactWorkspaceConfig?.isAdmin;
          const roleKey = isOwner
            ? Role.owner
            : isAdmin
              ? Role.admin
              : Role.user;
          const accessCount =
            m.contactWorkspaceConfig?.contactAppPermissionList?.length ?? 0;
          // Owners and admins have full access by role — not editable per app.
          const fullAccess = isOwner || Boolean(isAdmin);

          return (
            <div
              key={m.id}
              className={cn(
                GRID,
                'px-[22px] py-3.5',
                i < members.length - 1 && 'border-b border-ink-100',
              )}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-[34px] h-[34px] rounded-lg grid place-items-center text-white font-bold text-[11px] shrink-0 bg-gradient-to-br from-mint-300 to-royal">
                  {getInitials(m)}
                </span>
                <span className="text-[13.5px] font-semibold text-ink-900 truncate">
                  {m.fullName || m.name}
                </span>
              </div>

              <span className="text-[13px] text-ink-700 truncate">
                {m.emailAddress?.address}
              </span>

              <span
                className={cn(
                  'justify-self-start rounded-md px-2.5 py-0.5 text-[11.5px] font-bold',
                  isOwner
                    ? 'bg-mint-50 text-mint-700'
                    : 'bg-royal-pale text-royal-dark',
                )}>
                {i18n.t(RoleLabel[roleKey])}
              </span>

              <span className="text-[12.5px] text-ink-600">
                {fullAccess
                  ? i18n.t('All apps')
                  : `${accessCount} / ${availableApps.length} ${i18n.t('apps')}`}
              </span>

              <div className="justify-self-end">
                {fullAccess ? (
                  <span className="text-ink-300 text-sm">—</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing({mode: 'edit', member: m})}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-royal hover:text-royal-dark">
                    <MdOutlineEdit className="size-4" />
                    {i18n.t('Manage')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <InviteMemberModal
          open
          mode={editing.mode}
          member={editing.member}
          availableApps={availableApps}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
