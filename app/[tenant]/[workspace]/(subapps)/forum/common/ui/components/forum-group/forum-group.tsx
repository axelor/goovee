'use client';

import {useState, useTransition} from 'react';
import {Link} from '@/ui/components/link';
import {useRouter} from 'next/navigation';
import {
  MdArrowBack,
  MdAdd,
  MdKeyboardArrowUp,
  MdOutlineForum,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {formatRelativeTime} from '@/locale/formatters';
import {getPartnerImageURL} from '@/utils/files';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchParams, useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {UploadPost} from '../upload-post';
import {exitGroup, joinGroup} from '@/subapps/forum/common/action/action';

type AnyRec = any;

const SORTS = [
  {key: 'new', label: 'Recent'},
  {key: 'popular', label: 'Popular'},
];

// Group records carry no color — derive a stable pastille color from the name.
const PASTILLE_COLORS = [
  'palette-indigo',
  'palette-blue',
  'palette-purple',
  'palette-teal',
  'palette-cyan',
  'palette-green',
  'palette-orange',
  'palette-pink',
  'palette-red',
  'palette-deeppurple',
];

function groupColorClass(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `bg-${PASTILLE_COLORS[hash % PASTILLE_COLORS.length]}`;
}

function stripHtml(html?: string) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ForumGroup({
  group,
  groupMeta = {memberCount: 0, postCount: 0},
  posts = [],
  scoreByPost = {},
  isMember = false,
  memberRecordId,
  userId,
  groups = [],
  canPost = false,
  backHref,
}: {
  group: {id: string; name?: string | null};
  groupMeta?: {memberCount: number; postCount: number};
  posts?: AnyRec[];
  scoreByPost?: Record<string, number>;
  isMember?: boolean;
  memberRecordId?: string | null;
  userId?: string;
  groups?: AnyRec[];
  canPost?: boolean;
  backHref: string;
}) {
  const {workspaceURI, workspaceURL, tenant} = useWorkspace();
  const {searchParams, update} = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();
  const [, startTransition] = useTransition();

  const [joined, setJoined] = useState(isMember);
  const [pending, setPending] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const activeSort = searchParams.get('sort') || 'new';
  const postBase = `${workspaceURI}/${SUBAPP_CODES.forum}/post`;
  const colorClass = groupColorClass(group.name || '');
  const initial = (group.name || '#').trim().charAt(0).toUpperCase();
  const memberCount = groupMeta.memberCount + (joined && !isMember ? 1 : 0);

  const toggleMembership = () => {
    if (pending || !userId) return;
    const next = !joined;
    setJoined(next);
    setPending(true);
    startTransition(async () => {
      const res = next
        ? await joinGroup({
            groupID: group.id,
            userId,
            workspaceURL,
            workspaceURI,
          })
        : await exitGroup({
            id: memberRecordId ?? '',
            groupID: group.id,
            workspaceURL,
            workspaceURI,
          });
      setPending(false);
      if (!res?.success) {
        setJoined(!next);
        toast({
          variant: 'destructive',
          title: i18n.t(
            (res as {message?: string})?.message || 'An error occurred',
          ),
        });
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-ink-25 min-h-full">
      {/* Group hero */}
      <div className="bg-white border-b border-ink-100">
        <div className={cn('h-2.5', colorClass)} />
        <div className="container mx-auto py-5">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-500 hover:text-royal mb-4 transition-colors">
            <MdArrowBack className="size-4" />
            {i18n.t('Back to forum')}
          </Link>

          <div className="flex items-center gap-4 sm:gap-[18px] flex-wrap">
            <div
              className={cn(
                'size-16 rounded-[14px] grid place-items-center text-white text-[26px] font-extrabold shrink-0',
                colorClass,
              )}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900 leading-tight truncate">
                {group.name}
              </h1>
              <div className="mt-1.5 flex gap-4 text-[13px] text-ink-500">
                <span>
                  <strong className="text-ink-700">{memberCount}</strong>{' '}
                  {i18n.t('members')}
                </span>
                <span>
                  <strong className="text-ink-700">
                    {groupMeta.postCount}
                  </strong>{' '}
                  {i18n.t('discussions')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMembership}
              disabled={pending || !userId}
              className={cn(
                'shrink-0 px-[18px] py-2.5 rounded-[10px] text-[13px] font-bold transition-colors disabled:opacity-60',
                joined
                  ? 'bg-white text-royal border border-royal-border hover:bg-royal-pale'
                  : 'bg-royal text-white hover:bg-royal-dark',
              )}>
              {joined
                ? `✓ ${i18n.t('Member')}`
                : `+ ${i18n.t('Join the group')}`}
            </button>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              disabled={!canPost}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-royal text-white text-[13px] font-bold hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <MdAdd className="size-4" />
              {i18n.t('New discussion')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 mb-20 lg:mb-0">
        {/* Sort bar */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[16px] font-bold text-ink-900">
            {i18n.t('Discussions')}
          </h2>
          <div className="flex-1" />
          {SORTS.map(s => {
            const active = activeSort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  update([{key: 'sort', value: s.key}], {scroll: false})
                }
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors',
                  active
                    ? 'bg-royal-pale text-royal-dark'
                    : 'text-ink-600 hover:bg-ink-25',
                )}>
                {i18n.t(s.label)}
              </button>
            );
          })}
        </div>

        {/* Posts of this group only — no group badge (redundant here) */}
        {posts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {posts.map((post: AnyRec) => {
              const author = post.author?.simpleFullName;
              const date = post.postDateT || post.createdOn;
              const avatar = post.author?.picture?.id
                ? getPartnerImageURL(post.author.picture.id, tenant, {
                    noimage: true,
                  })
                : null;
              return (
                <Link
                  key={post.id}
                  href={`${postBase}/${post.id}`}
                  className="group bg-white border border-ink-100 rounded-xl shadow-xs p-[18px] grid grid-cols-[auto_1fr] gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  {/* Vote rail (synthetic) */}
                  <div className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg bg-ink-25 min-w-[56px] self-start">
                    <MdKeyboardArrowUp className="size-4 text-mint-500" />
                    <span className="text-[17px] font-extrabold text-ink-900 tabular-nums">
                      {scoreByPost[String(post.id)] ?? 0}
                    </span>
                    <span className="text-[10px] font-semibold text-ink-500">
                      {i18n.t('votes')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-ink-900 leading-snug tracking-[-0.01em]">
                      {post.title}
                    </h3>
                    {stripHtml(post.content) && (
                      <p className="mt-1.5 text-[13.5px] text-ink-600 leading-relaxed line-clamp-2">
                        {stripHtml(post.content)}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3.5 text-[12px] text-ink-500 flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-[22px] h-[22px] rounded-full overflow-hidden bg-gradient-to-br from-ink-300 to-ink-500 grid place-items-center text-white text-[9px] font-bold shrink-0">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatar}
                              alt={author || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (author || '?').slice(0, 1).toUpperCase()
                          )}
                        </span>
                        {author && (
                          <strong className="text-ink-700">{author}</strong>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MdOutlineForum className="size-3.5" />
                        {i18n.t('{0} replies', String(post.replyCount ?? 0))}
                      </span>
                      {date && <span>· {formatRelativeTime(date)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-12 text-center">
            <div
              className={cn(
                'mx-auto mb-3 size-14 rounded-[14px] grid place-items-center text-white text-2xl font-extrabold',
                colorClass,
              )}>
              {initial}
            </div>
            <div className="text-[15px] font-bold text-ink-900">
              {i18n.t('No discussion yet')}
            </div>
            <p className="mt-1 mb-4 text-[13px] text-ink-500">
              {i18n.t('Be the first to start a discussion in this group.')}
            </p>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              disabled={!canPost}
              className="inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-[10px] bg-royal text-white text-[13px] font-bold hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <MdAdd className="size-4" />
              {i18n.t('New discussion')}
            </button>
          </div>
        )}
      </div>

      <UploadPost
        open={composerOpen}
        groups={groups}
        selectedGroup={group as AnyRec}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}

export default ForumGroup;
