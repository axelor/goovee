'use client';

import {useState} from 'react';
import {Link} from '@/ui/components/link';
import {useRouter} from 'next/navigation';
import {MdAdd, MdChatBubbleOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {formatRelativeTime} from '@/locale/formatters';
import {getPartnerImageURL} from '@/utils/files';
import {SUBAPP_CODES} from '@/constants';
import {Search} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchParams} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {UploadPost} from '../upload-post';
import {SearchItem} from '../search-item';
import {findSearchPosts} from '@/subapps/forum/common/action/action';

type Post = any;

const SORTS = [
  {key: 'new', label: 'Recent'},
  {key: 'popular', label: 'Popular'},
];

function stripHtml(html?: string) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ForumFeed({
  posts = [],
  groups = [],
  canPost = false,
}: {
  posts?: Post[];
  groups?: any[];
  canPost?: boolean;
}) {
  const {workspaceURI, workspaceURL, tenant} = useWorkspace();
  const {searchParams, update} = useSearchParams();
  const router = useRouter();
  const activeSort = searchParams.get('sort') || 'new';
  const [composerOpen, setComposerOpen] = useState(false);

  const postBase = `${workspaceURI}/${SUBAPP_CODES.forum}/post`;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-900">
            {i18n.t('Community forum')}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          disabled={!canPost}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-royal text-white text-[13.5px] font-bold shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)] hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed">
          <MdAdd className="size-4" />
          {i18n.t('New discussion')}
        </button>
      </div>

      {/* Sort bar */}
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1">
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
                  'px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors',
                  active
                    ? 'bg-royal-pale text-royal-dark'
                    : 'text-ink-600 hover:bg-ink-25',
                )}>
                {i18n.t(s.label)}
              </button>
            );
          })}
        </div>
        <div className="w-full sm:w-[260px] shrink-0">
          <Search
            variant="compact"
            placeholder={i18n.t('Search a discussion…')}
            searchKey="title"
            findQuery={() =>
              findSearchPosts({workspaceURL})
                .then((r: any) => (r?.error ? [] : r))
                .catch(() => [])
            }
            renderItem={SearchItem}
            onItemClick={(result: {id: string}) =>
              router.push(`${postBase}/${result.id}`)
            }
            onViewAll={(query: string) =>
              update([{key: 'search', value: query}], {scroll: false})
            }
          />
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white border border-ink-100 rounded-xl shadow-xs py-14 text-center text-ink-500 font-medium">
          {i18n.t('No discussion yet.')}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const group = post.forumGroup?.name;
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
                className="group bg-white border border-ink-100 rounded-xl shadow-xs p-[18px] transition-all hover:-translate-y-0.5 hover:shadow-md">
                {group && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-royal-pale border border-royal-border text-royal-dark text-[11px] font-bold mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal" />
                    {group}
                  </span>
                )}
                <h3 className="text-[17px] font-bold text-ink-900 leading-snug">
                  {post.title}
                </h3>
                {stripHtml(post.content) && (
                  <p className="mt-1.5 text-[13.5px] text-ink-600 leading-relaxed line-clamp-2">
                    {stripHtml(post.content)}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2.5 text-[12px] text-ink-500">
                  <span className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-ink-300 to-ink-500 grid place-items-center text-white text-[10px] font-bold shrink-0">
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
                    <span className="font-semibold text-ink-700">{author}</span>
                  )}
                  <span className="text-ink-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MdChatBubbleOutline className="size-3.5" />
                    {i18n.t('{0} replies', String(post.replyCount ?? 0))}
                  </span>
                  {date && (
                    <>
                      <span className="text-ink-300">·</span>
                      <span>{formatRelativeTime(date)}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <UploadPost
        open={composerOpen}
        groups={groups}
        selectedGroup={null}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}

export default ForumFeed;
