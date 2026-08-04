'use client';
import {useEffect, useOptimistic, useRef, useState, useTransition} from 'react';
import {Link} from '@/ui/components/link';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {User} from '@/types';
import {Checkbox, Skeleton} from '@/ui/components';
import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchParams, useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {Group, MemberGroup} from '@/subapps/forum/common/types/forum';
import {exitGroup, joinGroup} from '@/subapps/forum/common/action/action';
import {groupColorClass} from '@/subapps/forum/common/utils/group-color';

function GroupRow({
  name,
  href,
  bold = false,
  isMember,
  checked = false,
  onToggleFilter,
  onJoin,
  onLeave,
}: {
  name?: string | null;
  href: string;
  bold?: boolean;
  isMember: boolean;
  checked?: boolean;
  onToggleFilter?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggleFilter?.()}
        aria-label={i18n.t('Filter the feed by {0}', name || '')}
        className="shrink-0"
      />
      <Link
        href={href}
        className="group/row flex items-center gap-2.5 flex-1 min-w-0">
        <span
          className={cn(
            'shrink-0 grid place-items-center size-[26px] rounded-lg text-white text-[12px] font-bold',
            groupColorClass(name || ''),
          )}>
          {(name || '#').trim().charAt(0).toUpperCase()}
        </span>
        <span
          className={cn(
            'flex-1 min-w-0 truncate text-[13px] text-ink-800 group-hover/row:text-royal transition-colors',
            bold ? 'font-semibold' : 'font-medium',
          )}>
          {name}
        </span>
      </Link>
      {isMember ? (
        <button
          type="button"
          onClick={onLeave}
          className="group/badge shrink-0">
          <span className="inline-flex group-hover/badge:hidden items-center px-2.5 py-1 rounded-full bg-royal-pale text-royal-dark text-[11px] font-bold">
            {i18n.t('Member')}
          </span>
          <span className="hidden group-hover/badge:inline-flex items-center px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 text-[11px] font-bold">
            {i18n.t('Leave group')}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 text-mint-500 hover:text-mint-600 text-[12.5px] font-bold transition-colors">
          + {i18n.t('Join group')}
        </button>
      )}
    </div>
  );
}

export function GroupControls({
  memberGroups,
  nonMemberGroups,
  user,
  onMemberCountChange,
}: {
  memberGroups: MemberGroup[];
  nonMemberGroups: Group[];
  user: User | null;
  selectedGroup?: Group | null;
  onMemberCountChange?: (count: number) => void;
}) {
  const userId = user?.id as string;
  const isLoggedIn = !!user?.id;
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const {searchParams, update} = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Feed group filter, written to the `groups` query param. The ref mirrors the
  // selection synchronously so fast clicks accumulate (the URL lags behind the
  // navigation); the effect resyncs from the URL when it actually changes.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(searchParams.getAll('groups')),
  );
  const selectedRef = useRef(selectedIds);

  useEffect(() => {
    const fromUrl = new Set(searchParams.getAll('groups'));
    selectedRef.current = fromUrl;
    setSelectedIds(fromUrl);
  }, [searchParams]);

  const toggleFilter = (groupId: string) => {
    if (!groupId) return;
    const next = new Set(selectedRef.current);
    if (next.has(groupId)) next.delete(groupId);
    else next.add(groupId);
    selectedRef.current = next;
    setSelectedIds(next);
    update([{key: 'groups', value: [...next]}], {scroll: false});
  };
  const clearFilter = () => {
    const empty = new Set<string>();
    selectedRef.current = empty;
    setSelectedIds(empty);
    update([{key: 'groups', value: []}], {scroll: false});
  };

  // Ref-based guard prevents double-clicks without any re-render that
  // could interfere with the RSC transition.
  const pendingRef = useRef(new Set<string>());

  // Single optimistic model holding both lists, so joining/leaving *moves* a
  // group between them instead of making it vanish until the server revalidates.
  const [groups, dispatch] = useOptimistic(
    {member: memberGroups || [], nonMember: nonMemberGroups || []},
    (
      state: {member: any[]; nonMember: any[]},
      action: {type: 'join' | 'leave'; groupId: string},
    ) => {
      if (action.type === 'join') {
        const g = state.nonMember.find((x: any) => x.id === action.groupId);
        if (!g) return state;
        return {
          member: [
            ...state.member,
            {id: g.id, forumGroup: {id: g.id, name: g.name, image: g.image}},
          ],
          nonMember: state.nonMember.filter(
            (x: any) => x.id !== action.groupId,
          ),
        };
      }
      // leave
      const g = state.member.find(
        (x: any) => x.forumGroup?.id === action.groupId,
      );
      return {
        member: state.member.filter(
          (x: any) => x.forumGroup?.id !== action.groupId,
        ),
        nonMember: g
          ? [
              ...state.nonMember,
              {
                id: g.forumGroup.id,
                name: g.forumGroup.name,
                image: g.forumGroup.image,
              },
            ]
          : state.nonMember,
      };
    },
  );

  const handleExit = (group: MemberGroup) => {
    const groupId = group.forumGroup.id;
    if (pendingRef.current.has(groupId)) return;
    pendingRef.current.add(groupId);
    startTransition(async () => {
      dispatch({type: 'leave', groupId});
      const response = await exitGroup({
        id: group.id,
        groupID: groupId,
        workspaceURL,
        workspaceURI,
      });
      pendingRef.current.delete(groupId);
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: i18n.t(response?.message || 'An error occurred'),
        });
      } else {
        // Reconcile the server-rendered base so the optimistic list (and the
        // "My groups" count mirrored from it) settle on the real value.
        router.refresh();
      }
    });
  };

  const handleJoin = (group: any) => {
    const groupId = group.id;
    if (pendingRef.current.has(groupId)) return;
    pendingRef.current.add(groupId);
    startTransition(async () => {
      dispatch({type: 'join', groupId});
      const response = await joinGroup({
        groupID: groupId,
        userId,
        workspaceURL,
        workspaceURI,
      });
      pendingRef.current.delete(groupId);
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: i18n.t(response?.message || 'An error occurred'),
        });
      } else {
        router.refresh();
      }
    });
  };

  const memberList = groups.member || [];
  const nonMemberList = groups.nonMember || [];
  const isEmpty = memberList.length === 0 && nonMemberList.length === 0;

  // The "My groups" stat lives in a sibling (the sidebar); lift the member
  // count up so it reflects this optimistic list, not a stale server value.
  useEffect(() => {
    onMemberCountChange?.(memberList.length);
  }, [memberList.length, onMemberCountChange]);
  const groupHref = (groupId: any) =>
    `${workspaceURI}/${SUBAPP_CODES.forum}/group/${groupId}`;

  return (
    <div className="bg-white border border-ink-100 rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink-500 mb-0">
          {i18n.t('My groups')}
        </h3>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={clearFilter}
            className="text-[11px] font-bold text-royal hover:text-royal-dark transition-colors">
            {i18n.t('Clear filter')}
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {isLoggedIn &&
          memberList.map((g: any, i: number) => (
            <GroupRow
              key={g.forumGroup?.id ?? g.id}
              name={g.forumGroup?.name}
              href={groupHref(g.forumGroup?.id)}
              bold={i === 0}
              isMember
              checked={selectedIds.has(String(g.forumGroup?.id))}
              onToggleFilter={() => toggleFilter(String(g.forumGroup?.id))}
              onLeave={() => handleExit(g)}
            />
          ))}

        {nonMemberList.map((g: any) => (
          <GroupRow
            key={g.id}
            name={g.name}
            href={groupHref(g.id)}
            isMember={false}
            checked={selectedIds.has(String(g.id))}
            onToggleFilter={() => toggleFilter(String(g.id))}
            onJoin={() => handleJoin(g)}
          />
        ))}

        {isEmpty && (
          <p className="py-2 text-[13px] text-ink-500">{i18n.t('No group')}</p>
        )}
      </div>
    </div>
  );
}

export default GroupControls;

export function GroupControlsSkeleton() {
  return (
    <div className="bg-white border border-ink-100 rounded-[14px] p-4">
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="rounded-lg size-[26px] shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
